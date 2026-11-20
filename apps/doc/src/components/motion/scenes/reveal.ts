/**
 * The "Reveal on scroll" scene: a feed of cards that rise as they come into the view of its box. Once plays each card the
 * first time it enters; Always plays it again on each entry. The two motions are defined here, and a card takes the one
 * the group chooses. Markup: `Reveal.astro`; controls: `RevealControls.tsx`, which render the state this scene publishes
 * (`sceneState.ts`). The hero of /motion/reveal.
 */
import { defineMotion } from '@udixio/motion';
import '@udixio/motion/presets';
import { createSceneState } from './sceneState';
import type { RevealMode, RevealState } from './RevealControls';

defineMotion('feed-once', {
  verb: 'reveal',
  keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }],
  stagger: 'normal',
  origin: 'first',
  repeat: 'once',
  axis: 'block',
});
defineMotion('feed-always', {
  verb: 'reveal',
  keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }],
  stagger: 'normal',
  origin: 'first',
  repeat: 'always',
  axis: 'block',
});

export function mount(root: HTMLElement): () => void {
  const feed = root.querySelector<HTMLElement>('[data-reveal-feed]');
  const cards = feed ? ([...feed.children] as HTMLElement[]) : [];
  if (!feed || cards.length === 0) return () => {};
  let mode: RevealMode = 'once';
  const state = createSceneState<RevealState>(root, () => ({ mode }));

  // A card takes its motion once the two are defined: the group's choice is the motion's name. Changing it binds the card again.
  const choose = (next: RevealMode) => {
    mode = next;
    const name = mode === 'always' ? 'feed-always' : 'feed-once';
    for (const card of cards) card.dataset.motion = name;
    state.publish();
  };
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-reveal-mode]') : null;
    if (target) choose(target.dataset.revealMode === 'always' ? 'always' : 'once');
  };
  root.addEventListener('click', onClick);
  choose(mode);

  return () => {
    root.removeEventListener('click', onClick);
    state.stop();
  };
}
