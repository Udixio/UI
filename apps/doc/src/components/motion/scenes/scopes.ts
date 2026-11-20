/**
 * The "Per breakpoint" scene: a reveal names another reveal in its `--udx-motion`. A card of the reveal family takes only a
 * reveal: `fade` (a presence) would be ignored on a `rise` card, so the scene defines `fade-on-view`, a reveal that fades
 * without the rise. Replay plays each card again with `play()`; on the need page, Inspect this page reports the bindings
 * and the policy of the page with `inspect()`. Markup: `Scopes.astro`; controls: `ScopesControls.tsx` (Udixio Buttons, which
 * keep no state). The hero of /motion/scopes.
 */
import { defineMotion, getMotion } from '@udixio/motion';
import '@udixio/motion/presets';
import { inspect } from '@udixio/motion/scope';

defineMotion('fade-on-view', {
  verb: 'reveal',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
});

export function mount(root: HTMLElement): () => void {
  const cards = [...root.querySelectorAll<HTMLElement>('[data-scopes-scene] > [data-motion]')];
  if (cards.length === 0) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-scopes-readout]');

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-scopes-replay]')) {
      for (const card of cards) getMotion(card)?.play();
      return;
    }
    if (target.closest('[data-scopes-inspect]') && readout) {
      const report = inspect();
      readout.textContent = `policy: ${report.policy.source} · ${report.bindings.length} bindings on the page · ${report.definitions.length} motions defined`;
    }
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
