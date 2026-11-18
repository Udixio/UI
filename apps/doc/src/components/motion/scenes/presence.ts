/**
 * The "Show and hide" scene: a confirmation card with a presence motion. Hide sets `hidden` and its exit plays; Show
 * removes it and its entry plays. The preset group swaps the card's motion. Markup: `Presence.astro`. Shared by the
 * root-page tile and the hero of /motion/presence.
 */

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-presence-card]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-presence-toggle]');
  if (!card || !toggle) return () => {};
  const presetButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-presence-preset]')];
  const readout = root.querySelector<HTMLElement>('[data-presence-readout]');

  function show(visible: boolean): void {
    // Hidden: the exit plays, then the card is gone. Shown: the entry plays.
    card!.hidden = !visible;
    toggle!.setAttribute('aria-expanded', String(visible));
    toggle!.textContent = visible ? 'Hide' : 'Show';
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-presence-toggle]')) {
      show(card.hidden);
      return;
    }
    if (target.closest('[data-presence-close]')) {
      // Focus goes to the toggle (data-motion-restore-focus) before the card becomes inert.
      show(false);
      return;
    }
    const presetButton = target.closest<HTMLButtonElement>('[data-presence-preset]');
    if (presetButton) {
      const preset = presetButton.dataset.presencePreset ?? 'slide';
      for (const button of presetButtons) button.setAttribute('aria-pressed', String(button === presetButton));
      card.dataset.motion = preset;
      if (readout) readout.textContent = `data-motion="${preset}"`;
    }
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
