/**
 * The "Loop, and pause it" scene: a spinner, a live dot and a recording light, which can be paused (`pause: 'control'`), and
 * an indeterminate bar, which cannot (`pause: 'essential'`, with the reason written in its definition). Pause loops holds the
 * three that can be paused with `data-motion-paused`. Under reduced motion no loop plays. Markup: `Loop.astro`, controls:
 * `LoopControls.astro`. Shared by the root-page tile and the hero of /motion/loop.
 */
import { defineMotion } from '@udixio/motion';
import '@udixio/motion/presets';

// The bar is the content itself: it says that work is running, and a paused bar would look finished. The page offers no
// control for it, and the definition says why. Its stripes move one period (16 px), so the bar looks the same at each
// step: a sliding segment would need the track's width in pixels, and a keyframe cannot state it for a responsive bar.
defineMotion('indeterminate-bar', {
  verb: 'loop',
  keyframes: [{ x: 0 }, { x: -16 }],
  timing: { duration: 'duration.extraLong1', easing: 'easing.linear' },
  pause: 'essential',
  reason: 'The bar shows that work is running; a paused bar would look finished.',
});

export function mount(root: HTMLElement): () => void {
  const loops = [...root.querySelectorAll<HTMLElement>('[data-loop-pausable]')];
  const toggle = root.querySelector<HTMLButtonElement>('[data-loop-toggle]');
  const bar = root.querySelector<HTMLElement>('[data-loop-bar]');
  if (!toggle || loops.length === 0) return () => {};

  if (bar) bar.dataset.motion = 'indeterminate-bar';

  let paused = false;
  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-loop-toggle]')) return;
    paused = !paused;
    for (const loop of loops) loop.toggleAttribute('data-motion-paused', paused);
    toggle.textContent = paused ? 'Play loops' : 'Pause loops';
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
