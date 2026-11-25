/**
 * The "Per breakpoint" scene: Replay plays each card again with `play()`. The motion that the second card names from `md` up,
 * `fade-on-view`, is defined by the page itself (per-breakpoint.astro), so that it exists before any card can play. Markup:
 * `Scopes.astro`; controls: `ScopesControls.tsx` (a Udixio Button, which keeps no state). The hero of /motion/per-breakpoint.
 */
import { getMotion } from '@udixio/motion';

export function mount(root: HTMLElement): () => void {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-scopes-scene] > [data-motion]')];
  if (cards.length === 0) return () => {};

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-scopes-replay]')) {
      for (const card of cards) getMotion(card)?.play();
    }
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
