/**
 * The "Animate any CSS" scene: each press of Next state animates the card to its next state with `animateStyle`, over the
 * effects spring (no overshoot, so the radius and the clip never pass their ends). On the need page, a range input drives a
 * dot over a spring (`createSpring`) that lags behind it and settles. Under reduced motion `animateStyle` shows the end
 * frame at once, and the number jumps. Markup: `Animate.astro`; controls: `AnimateControls.astro`. Shared by the root-page
 * tile and the hero of /motion/animate.
 */
import { animateStyle, createSpring } from '@udixio/motion/animate';

/** The states of the card, in order: the first is the one the stylesheet gives it. */
const STATES = [
  { backgroundColor: 'var(--color-primary-container)', borderRadius: '28px', clipPath: 'inset(0% round 28px)' },
  { backgroundColor: 'var(--color-tertiary-container)', borderRadius: '8px', clipPath: 'inset(6% 4% round 8px)' },
  { backgroundColor: 'var(--color-secondary-container)', borderRadius: '48px', clipPath: 'inset(0% 12% round 48px)' },
];

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-animate-card]');
  const range = root.querySelector<HTMLInputElement>('[data-animate-range]');
  const dot = root.querySelector<HTMLElement>('[data-animate-dot]');
  const label = root.querySelector<HTMLElement>('[data-animate-state]');
  if (!card) return () => {};
  let state = 0;

  // The dot's position is a fraction of its track, written in --p, which the stylesheet turns into a translation.
  const offset = dot
    ? createSpring(0, {
        timing: 'spring.default.spatial',
        onUpdate: (value) => dot.style.setProperty('--p', String(value)),
      })
    : undefined;

  const onClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-animate-next]')) return;
    state = (state + 1) % STATES.length;
    // A single keyframe starts from the card's current style, and runs over the effects spring.
    animateStyle(card, STATES[state]!, { timing: 'spring.default.effects' });
    if (label) label.textContent = `State ${state + 1} of ${STATES.length}`;
  };
  const onInput = () => offset?.to(Number(range?.value ?? 0) / 100);

  root.addEventListener('click', onClick);
  range?.addEventListener('input', onInput);

  return () => {
    root.removeEventListener('click', onClick);
    range?.removeEventListener('input', onInput);
    offset?.stop();
  };
}
