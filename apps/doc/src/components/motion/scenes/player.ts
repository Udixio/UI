/**
 * The signature scene of the root page: the mini-player opens into the full player (a container transform). In one
 * task the mini-player is hidden and the player shown: they share a key, so the bar grows into the screen, its corners
 * kept round. Its content fades through: the bar's leaves at once, and the player's cover (`scale`), title, progress and
 * controls (`slide`) arrive in turn once the surface has grown most of the way. Close, Escape or the
 * arrow plays it back, and the focus returns to the control that opened it. Play is a toggle that presses (`press`). A
 * press during a motion turns it around from where it is. Markup: `Player.astro`; the stage's "Open the player" button is
 * `PlayerOpen.tsx`.
 *
 * The scene plays by itself: it opens, presses Play, rests, and closes, again and again, so the morph is seen without a
 * click. The cycle runs on the frame clock of the motion runtime, which ticks only while the stage is in view, the tab is
 * shown and motion is not reduced; it also holds while the visitor's pointer or focus is on the stage, and resumes once
 * both have left. It never moves the focus. The stage's `data-player-autoplay` tells which: `on`, `held` or `off`.
 */
import { getMotionRuntime, loadLayoutEngine, retainMotionRuntime } from '@udixio/motion';
import { createSceneState } from './sceneState';

/** The state the stage's controls render from (`PlayerOpen.tsx`). */
export type PlayerState = { open: boolean };

/**
 * Milliseconds between the start of the morph and the arrival of the new surface's content (a fade through): the player's
 * content rises into a surface that has grown most of the way; the bar's fades in once it has nearly settled, so its text
 * is never seen squeezed.
 */
const OPEN_DELAY = 90;
const CLOSE_DELAY = 180;
/** How long the focus ring waits: a ring drawn on a surface that is morphing would be stretched with it. */
const MORPH = 360;

/**
 * The cycle, in milliseconds of visible time: the first opening comes soon after the stage is seen, then the player stays
 * open long enough to read it (Play is pressed on the way), and the bar rests a little before the next opening.
 */
const FIRST_REST = 1200;
const REST = 2800;
const PRESS_AT = 1100;
const HOLD = 3800;
/** After a hold, the cycle resumes with at least this much of its step left, so leaving the stage does not snap it shut. */
const RESUME_LEFT = 1600;
/** A gap between two ticks longer than this is a pause of the clock (off-screen, hidden tab), not time that passed. */
const GAP = 250;

export function mount(root: HTMLElement): () => void {
  const mini = root.querySelector<HTMLButtonElement>('[data-player-open][data-motion-shared]');
  const full = root.querySelector<HTMLElement>('[data-player-full]');
  const close = root.querySelector<HTMLButtonElement>('[data-player-close]');
  const play = root.querySelector<HTMLButtonElement>('[data-player-play]');
  const items = [...root.querySelectorAll<HTMLElement>('[data-player-item]')];
  const miniItems = [...root.querySelectorAll<HTMLElement>('[data-player-mini-item]')];
  if (!mini || !full || !close || !play) return () => {};

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

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();

  const state = createSceneState<PlayerState>(root, () => ({ open: !full.hidden }));
  /** The control that opened the player, where the focus goes back when the visitor closes it. */
  let opener: 'mini' | 'caption' = 'mini';

  function open(visitor: boolean): void {
    if (!full!.hidden) return;
    for (const item of miniItems) item.hidden = true;
    mini!.hidden = true;
    full!.hidden = false;
    after(OPEN_DELAY, () => {
      if (!full!.hidden) for (const item of items) item.hidden = false;
    });
    mini!.setAttribute('aria-expanded', 'true');
    state.publish();
    if (visitor) requestAnimationFrame(() => close!.focus());
  }

  function shut(visitor: boolean): void {
    if (full!.hidden) return;
    for (const item of items) item.hidden = true;
    full!.hidden = true;
    mini!.hidden = false;
    // The stage's button comes back with the bar's content, once the surface has nearly settled; at once when the visitor
    // closed the player, since the focus returns to it.
    after(CLOSE_DELAY, () => {
      if (!mini!.hidden) for (const item of miniItems) item.hidden = false;
      if (!visitor) state.publish();
    });
    mini!.setAttribute('aria-expanded', 'false');
    if (visitor) {
      state.publish();
      returnFocus();
    }
  }

  /** The mini-player is there at once; the stage's button is rendered again by its island, a frame or two later. */
  function returnFocus(): void {
    if (opener === 'mini') return mini!.focus();
    let frames = 0;
    const seek = () => {
      // The island holds a Button and an IconButton, one of them displayed (by the width of the page). The button that
      // left comes back as the same element, inert until its entry starts: focus cannot land on it before then.
      const caption = [...root.querySelectorAll<HTMLElement>('[data-player-caption] button')].find(
        (button) => button.getClientRects().length > 0 && !button.closest('[inert]'),
      );
      if (caption) caption.focus();
      else if (++frames < 20) requestAnimationFrame(seek);
      else mini!.focus();
    };
    requestAnimationFrame(seek);
  }

  function setPlaying(playing: boolean): void {
    play!.setAttribute('aria-pressed', String(playing));
    play!.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    // An emphasis replays on each change of data-state.
    play!.dataset.state = playing ? 'playing' : 'paused';
  }
  const playing = () => play!.getAttribute('aria-pressed') === 'true';

  // The cycle: where it is, how long it has been there, and whether the visitor holds it.
  const runtime = getMotionRuntime();
  const release = retainMotionRuntime(runtime);
  let elapsed = 0;
  let rest = FIRST_REST;
  let pressed = false;
  let last: number | undefined;
  let hovered = false;
  let focused = false;
  /** The player was opened by the cycle (not by the visitor): reduced motion closes it. */
  let openedByCycle = false;
  let unpress: number | undefined;

  const held = () => hovered || focused;
  const step = () => (full.hidden ? rest : HOLD);
  function mark(): void {
    root.dataset.playerAutoplay = runtime.policy.reduced ? 'off' : held() ? 'held' : 'on';
  }

  const stopClock = runtime.subscribe(
    'doc-player-cycle',
    {
      tick(timestamp) {
        const gap = last === undefined ? Infinity : timestamp - last;
        last = timestamp;
        if (gap > GAP || held()) return;
        elapsed += gap;
        if (full!.hidden) {
          if (elapsed < rest) return;
          openedByCycle = true;
          pressed = false;
          elapsed = 0;
          open(false);
        } else {
          if (!pressed && elapsed >= PRESS_AT) {
            pressed = true;
            if (!playing()) setPlaying(true);
          }
          if (elapsed < HOLD) return;
          elapsed = 0;
          rest = REST;
          openedByCycle = false;
          shut(false);
          // The next opening presses Play again: the player is paused while it is closed.
          window.clearTimeout(unpress);
          unpress = window.setTimeout(() => {
            if (full!.hidden) setPlaying(false);
          }, MORPH);
        }
      },
    },
    { pauseWhenReduced: true, root },
  );

  // Reduced motion stops the cycle where it is; a player the cycle opened goes back to its bar (no motion is played).
  const stopPolicy = runtime.policy.subscribe(() => {
    if (runtime.policy.reduced && openedByCycle && !held()) {
      openedByCycle = false;
      shut(false);
    }
    mark();
  });

  /** The visitor took over: the cycle starts its step again from their state once they leave. */
  function took(): void {
    openedByCycle = false;
    elapsed = 0;
    rest = REST;
    pressed = true;
  }

  function resume(): void {
    // A hold keeps the time already spent, but never leaves less than RESUME_LEFT of the step.
    elapsed = Math.min(elapsed, Math.max(0, step() - RESUME_LEFT));
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const trigger = target.closest('[data-player-open]');
    if (trigger) {
      opener = trigger === mini ? 'mini' : 'caption';
      took();
      return open(true);
    }
    if (target.closest('[data-player-close]')) {
      took();
      return shut(true);
    }
    if (target.closest('[data-player-play]')) {
      took();
      setPlaying(!playing());
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || full!.hidden) return;
    event.preventDefault();
    took();
    shut(true);
  };

  const onPointerEnter = () => {
    hovered = true;
    mark();
  };
  const onPointerLeave = () => {
    hovered = false;
    if (!held()) resume();
    mark();
  };
  const onFocusIn = () => {
    focused = true;
    mark();
  };
  const onFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget instanceof Node && root.contains(event.relatedTarget)) return;
    // A control that leaves (the island's button while it is re-rendered) drops the focus to the body for a moment.
    window.setTimeout(() => {
      if (root.contains(document.activeElement)) return;
      focused = false;
      if (!held()) resume();
      mark();
    });
  };

  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('pointerenter', onPointerEnter);
  root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('focusout', onFocusOut);
  focused = root.contains(document.activeElement);
  hovered = root.matches(':hover');
  mark();

  return () => {
    stopClock();
    stopPolicy();
    release();
    state.stop();
    window.clearTimeout(later);
    window.clearTimeout(morphing);
    window.clearTimeout(unpress);
    delete root.dataset.morphing;
    delete root.dataset.playerAutoplay;
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('pointerenter', onPointerEnter);
    root.removeEventListener('pointerleave', onPointerLeave);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
  };
}
