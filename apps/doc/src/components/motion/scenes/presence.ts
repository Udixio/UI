/**
 * The "Show and hide" scene: a confirmation card with a presence motion. Hide sets `hidden` and its exit plays; Show
 * removes it and its entry plays. The preset chips swap the card's motion. Markup: `Presence.astro` (the card, neutral)
 * and `PresenceControls.tsx` (the controls, Udixio UI components that render the state this scene publishes).
 */
import { createSceneState } from './sceneState';
import type { PresencePreset, PresenceState } from './PresenceControls';

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-presence-card]');
  if (!card) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-presence-readout]');
  let preset = (card.dataset.motion ?? 'slide') as PresencePreset;
  const state = createSceneState<PresenceState>(root, () => ({ visible: !card.hidden, preset }));

  function show(visible: boolean): void {
    // Hidden: the exit plays, then the card is gone. Shown: the entry plays.
    card!.hidden = !visible;
    state.publish();
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
    const presetChip = target.closest<HTMLElement>('[data-presence-preset]');
    if (presetChip) {
      preset = (presetChip.dataset.presencePreset ?? 'slide') as PresencePreset;
      card.dataset.motion = preset;
      if (readout) readout.textContent = `data-motion="${preset}"`;
      state.publish();
    }
  };
  root.addEventListener('click', onClick);

  return () => {
    root.removeEventListener('click', onClick);
    state.stop();
  };
}
