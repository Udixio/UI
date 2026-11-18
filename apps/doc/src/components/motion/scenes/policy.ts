/**
 * The "Reduced motion" scene: Hide and Show play the card's presence, Move plays the pill's layout, and Pause holds the
 * loop. The readout states what the policy does at this moment, read from the document: its attribute
 * (`data-motion-policy`) and the scale it gives (`--udx-motion-scale`), which the system setting sets too. It follows the
 * switch of the page as the switch writes the attribute. Markup: `Policy.astro`; controls: `PolicyControls.astro`. Shared by
 * the root-page tile and the hero of /motion/accessibility.
 */
const FULL = 'Full motion: the card slides, the pill glides, the dot breathes.';
const REDUCED = 'Reduced motion: the card fades, the pill jumps, the dot holds still.';

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-policy-card]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-policy-toggle]');
  const row = root.querySelector<HTMLElement>('[data-policy-row]');
  const pill = root.querySelector<HTMLElement>('[data-policy-pill]');
  const loop = root.querySelector<HTMLElement>('[data-policy-loop]');
  const pause = root.querySelector<HTMLButtonElement>('[data-policy-pause]');
  const readout = root.querySelector<HTMLElement>('[data-policy-readout]');
  if (!card || !toggle || !row || !pill) return () => {};
  let paused = false;

  // The scale the document gives: 0 under reduced motion, whether the switch or the system asks for it.
  const sync = () => {
    if (!readout) return;
    const scale = getComputedStyle(document.documentElement).getPropertyValue('--udx-motion-scale').trim();
    readout.textContent = scale === '0' ? REDUCED : FULL;
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion-policy'] });
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  query.addEventListener('change', sync);
  sync();

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-policy-toggle]')) {
      // Hidden: the exit plays, then the card is gone. Shown: the entry plays.
      card.hidden = !card.hidden;
      toggle.setAttribute('aria-expanded', String(!card.hidden));
      toggle.textContent = card.hidden ? 'Show' : 'Hide';
      return;
    }
    if (target.closest('[data-policy-move]')) {
      row.toggleAttribute('data-end');
      return;
    }
    if (target.closest('[data-policy-pause]') && loop && pause) {
      paused = !paused;
      loop.toggleAttribute('data-motion-paused', paused);
      pause.textContent = paused ? 'Play' : 'Pause';
    }
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    query.removeEventListener('change', sync);
    observer.disconnect();
  };
}
