/**
 * The "Draw or morph SVG" scene: a check mark drawn once, when it enters the view (a reveal of `draw`), and an M3 shape that
 * morphs into the one a visitor chooses. On a need page, a dot travels along an arc (a reveal of `along`), and Move again
 * replays it. Under reduced motion the shape and the check are set at once. Markup: `Svg.astro`; controls: `SvgControls.tsx`,
 * which render the state this scene publishes (`sceneState.ts`). The hero of /motion/svg.
 */
import { defineMotion, motion, type MotionBinding } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';
import { createSceneState } from './sceneState';
import type { SvgShape, SvgState } from './SvgControls';

defineMotion('svg-check', {
  verb: 'reveal',
  keyframes: [{ draw: 0 }, { draw: 1 }],
  timing: {
    duration: 'duration.extraLong1',
    easing: 'easing.standard',
  },
});
defineMotion('svg-travel', {
  verb: 'reveal',
  keyframes: [{ along: 0 }, { along: 1 }],
  timing: {
    duration: 'duration.extraLong2',
    easing: 'easing.standard',
  },
});

export function mount(root: HTMLElement): () => void {
  const icon = root.querySelector<SVGPathElement>('[data-svg-morph]');
  const check = root.querySelector<SVGPathElement>('[data-svg-check]');
  if (!icon || !check) return () => {};
  // The page names the shape in its readout; a tile's chip is rendered by the controls from the state.
  const readout = root.querySelector<HTMLElement>('[data-svg-readout]');
  const travel = root.querySelector<HTMLElement>('[data-svg-travel]');
  let shape: SvgShape = 'Cookie';
  const state = createSceneState<SvgState>(root, () => ({ shape }));

  const drawn: MotionBinding = motion(check, 'svg-check');
  const dot: MotionBinding | undefined = travel ? motion(travel, 'svg-travel') : undefined;
  let morphing: ReturnType<typeof morph> | undefined;

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const option = target.closest<HTMLElement>('[data-svg-shape]');
    if (option) {
      shape = (option.dataset.svgShape ?? 'Cookie') as SvgShape;
      state.publish();
      const to = root.querySelector<SVGPathElement>(`[data-svg-target="${shape}"]`);
      // A new morph continues from the shape the icon has reached.
      if (to) {
        morphing?.cancel();
        morphing = morph(icon, to, { timing: 'spring.default.spatial' });
      }
      if (readout) readout.textContent = `morph: '${shape}'`;
      return;
    }
    if (target.closest('[data-svg-draw-again]')) drawn.play();
    else if (target.closest('[data-svg-move-again]')) dot?.play();
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    state.stop();
    morphing?.cancel();
    drawn.destroy();
    dot?.destroy();
  };
}
