/**
 * The "Draw or morph SVG" scene: a check mark drawn once, when it enters the view (a reveal of `draw`), and an M3 shape that
 * morphs into the one a visitor chooses. On a need page, a dot travels along an arc (a reveal of `along`), and Move again
 * replays it. Under reduced motion the shape and the check are set at once. Markup: `Svg.astro`; controls: `SvgControls.astro`.
 * Shared by the root-page tile and the hero of /motion/svg.
 */
import { defineMotion, motion, type MotionBinding } from '@udixio/motion';
import { morph } from '@udixio/motion/svg';

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
  const shapes = [...root.querySelectorAll<HTMLButtonElement>('[data-svg-shape]')];
  const readout = root.querySelector<HTMLElement>('[data-svg-readout]');
  const travel = root.querySelector<HTMLElement>('[data-svg-travel]');

  const drawn: MotionBinding = motion(check, 'svg-check');
  const dot: MotionBinding | undefined = travel ? motion(travel, 'svg-travel') : undefined;
  let morphing: ReturnType<typeof morph> | undefined;

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const shape = target.closest<HTMLButtonElement>('[data-svg-shape]');
    if (shape) {
      const name = shape.dataset.svgShape ?? '';
      for (const each of shapes) each.setAttribute('aria-pressed', String(each === shape));
      const to = root.querySelector<SVGPathElement>(`[data-svg-target="${name}"]`);
      // A new morph continues from the shape the icon has reached.
      if (to) {
        morphing?.cancel();
        morphing = morph(icon, to, { timing: 'spring.default.spatial' });
      }
      if (readout) readout.textContent = `morph: '${name}'`;
      return;
    }
    if (target.closest('[data-svg-draw-again]')) drawn.play();
    else if (target.closest('[data-svg-move-again]')) dot?.play();
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    morphing?.cancel();
    drawn.destroy();
    dot?.destroy();
  };
}
