/**
 * The "Reveal on scroll" scene: a feed of cards that rise as they come into the view of its box. Once plays each card the
 * first time it enters; Always plays it again on each entry. The two motions are defined here, and a card takes the one
 * the group chooses. Markup: `Reveal.astro`, controls: `RevealControls.astro`. Shared by the root-page tile and the hero
 * of /motion/reveal.
 */
import { defineMotion } from '@udixio/motion';
import '@udixio/motion/presets';

const KEYFRAMES = [
  { opacity: 0, y: 24 },
  { opacity: 1, y: 0 },
];
defineMotion('feed-once', { verb: 'reveal', keyframes: KEYFRAMES, stagger: 'normal', origin: 'first', repeat: 'once', axis: 'block' });
defineMotion('feed-always', { verb: 'reveal', keyframes: KEYFRAMES, stagger: 'normal', origin: 'first', repeat: 'always', axis: 'block' });

export function mount(root: HTMLElement): () => void {
  const feed = root.querySelector<HTMLElement>('[data-reveal-feed]');
  const cards = feed ? [...feed.children] as HTMLElement[] : [];
  const modes = [...root.querySelectorAll<HTMLButtonElement>('[data-reveal-mode]')];
  const readout = root.querySelector<HTMLElement>('[data-reveal-readout]');
  if (!feed || cards.length === 0) return () => {};

  // A card takes its motion once the two are defined: the group's choice is the motion's name. Changing it binds the card again.
  const choose = (mode: string) => {
    const name = mode === 'always' ? 'feed-always' : 'feed-once';
    for (const card of cards) card.dataset.motion = name;
    for (const button of modes) button.setAttribute('aria-pressed', String(button.dataset.revealMode === mode));
    if (readout) readout.textContent = `repeat: '${mode}'`;
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-reveal-mode]') : null;
    if (target) choose(target.dataset.revealMode ?? 'once');
  };
  root.addEventListener('click', onClick);
  choose(modes.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.revealMode ?? 'once');

  return () => root.removeEventListener('click', onClick);
}
