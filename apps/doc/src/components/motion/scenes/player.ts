/**
 * The signature scene of the root page: the mini-player opens into the full player (a container transform). In one
 * task the mini-player is hidden and the player shown: they share a key, so the bar grows into the screen, its corners
 * kept round. Its content fades through: the bar's leaves at once, and the player's cover (`scale`), title, progress and
 * controls (`slide`) arrive in turn once the surface has grown most of the way. Close, Escape or the
 * arrow plays it back, and the focus returns to the mini-player. Play is a toggle that presses (`press`). A press during
 * a motion turns it around from where it is. Markup: `Player.astro`.
 */
import { loadLayoutEngine } from '@udixio/motion';

/**
 * Milliseconds between the start of the morph and the arrival of the new surface's content (a fade through): the player's
 * content rises into a surface that has grown most of the way; the bar's fades in once it has nearly settled, so its text
 * is never seen squeezed.
 */
const OPEN_DELAY = 90;
const CLOSE_DELAY = 180;
/** How long the focus ring waits: a ring drawn on a surface that is morphing would be stretched with it. */
const MORPH = 360;

export function mount(root: HTMLElement): () => void {
  const mini = root.querySelector<HTMLButtonElement>('[data-player-open]');
  const full = root.querySelector<HTMLElement>('[data-player-full]');
  const close = root.querySelector<HTMLButtonElement>('[data-player-close]');
  const play = root.querySelector<HTMLButtonElement>('[data-player-play]');
  const items = [...root.querySelectorAll<HTMLElement>('[data-player-item]')];
  const miniItems = [...root.querySelectorAll<HTMLElement>('[data-player-mini-item]')];
  /** The content of the surface that arrives fades in once the surface has grown or shrunk most of the way. */
  let later: number | undefined;
  let morphing: number | undefined;
  const after = (delay: number, show: () => void) => {
    window.clearTimeout(later);
    later = window.setTimeout(show, delay);
    window.clearTimeout(morphing);
    root.dataset.morphing = '';
    morphing = window.setTimeout(() => delete root.dataset.morphing, MORPH);
  };
  if (!mini || !full || !close || !play) return () => {};

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();

  function open(): void {
    if (!full!.hidden) return;
    for (const item of miniItems) item.hidden = true;
    mini!.hidden = true;
    full!.hidden = false;
    after(OPEN_DELAY, () => {
      if (!full!.hidden) for (const item of items) item.hidden = false;
    });
    mini!.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => close!.focus());
  }

  function shut(): void {
    if (full!.hidden) return;
    for (const item of items) item.hidden = true;
    full!.hidden = true;
    mini!.hidden = false;
    after(CLOSE_DELAY, () => {
      if (!mini!.hidden) for (const item of miniItems) item.hidden = false;
    });
    mini!.setAttribute('aria-expanded', 'false');
    mini!.focus();
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-player-open]')) return open();
    if (target.closest('[data-player-close]')) return shut();
    if (target.closest('[data-player-play]')) {
      const playing = play!.getAttribute('aria-pressed') !== 'true';
      play!.setAttribute('aria-pressed', String(playing));
      play!.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      // An emphasis replays on each change of data-state.
      play!.dataset.state = playing ? 'playing' : 'paused';
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || full!.hidden) return;
    event.preventDefault();
    shut();
  };

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  return () => {
    window.clearTimeout(later);
    window.clearTimeout(morphing);
    delete root.dataset.morphing;
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
  };
}
