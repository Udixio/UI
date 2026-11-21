/**
 * The "Make a list appear" scene: a notification list. Messages added together cascade in from the chosen origin, at the
 * chosen stagger; past five, the oldest leave out of the flow (or in place) while their neighbours close the gap; a message
 * is swiped away, or focused and deleted. Markup: `Inbox.astro`; controls: `InboxControls.tsx`, which renders the options
 * this scene publishes. Shared by the root-page tile and the hero of /motion/lists, which also offers the stagger and the exit.
 */
import { defineMotion, getMotion, loadLayoutEngine } from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import {
  createInboxItem,
  INBOX_EXITS,
  INBOX_ORIGINS,
  INBOX_STAGGERS,
  type InboxExit,
  type InboxOrigin,
  type InboxStagger,
} from './data/inbox';
import { createSceneState } from './sceneState';
import type { InboxState } from './InboxControls';

/** The name of the motion of a new message, for each origin, stagger and exit: one definition per combination. */
export const inboxMotion = (origin: InboxOrigin, stagger: InboxStagger, exit: InboxExit): string =>
  `inbox-${origin}-${stagger}-${exit}`;

for (const origin of INBOX_ORIGINS) {
  for (const stagger of INBOX_STAGGERS) {
    for (const exit of INBOX_EXITS) {
      defineMotion(inboxMotion(origin, stagger, exit), {
        verb: 'appear',
        stagger,
        origin,
        exit,
        // A short curve: a leaving message is gone before the ones that arrive reach its place.
        timing: { duration: 'duration.short4', easing: 'easing.standard' },
        keyframes: [
          { opacity: 0, y: -16, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1 },
        ],
      });
    }
  }
}
defineGesture('dismiss', { type: 'swipe', alternative: 'action' });

/** The list shows this many messages; the oldest leave beyond it. */
const VISIBLE = 5;

export function mount(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLUListElement>('[data-inbox-list]');
  if (!list) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-inbox-readout]');
  // The page offers the stagger and the exit too: the readout then names all three.
  const offersAll = root.querySelector('[data-inbox-stagger]') !== null;

  let origin: InboxOrigin = 'first';
  let stagger: InboxStagger = 'normal';
  let exit: InboxExit = 'out-of-flow';
  let next = Number(list.dataset.inboxNext ?? 0);
  const leaving = new Set<Element>();
  let mounted = true;
  const state = createSceneState<InboxState>(root, () => ({ origin, stagger, exit }));

  function describe(): void {
    if (!readout) return;
    readout.textContent = offersAll ? `origin: '${origin}' · stagger: '${stagger}' · exit: '${exit}'` : `origin: '${origin}'`;
  }

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();
  describe();

  // The messages of the page take their presence and their gesture now that both are defined: bound settled, they play
  // no entry.
  for (const item of list.children) {
    if (!(item instanceof HTMLElement)) continue;
    item.dataset.motion = `${inboxMotion(origin, stagger, exit)} reflow`;
    item.dataset.motionGesture = 'dismiss';
  }

  /**
   * Makes room for `incoming` messages: the oldest beyond the visible count leave first. Out of the flow, they fade where
   * they stand while the others move past them; in place, they keep their room until the exit has played.
   */
  function makeRoom(incoming: number): void {
    const staying = [...list!.children].filter((item) => !leaving.has(item));
    // From the bottom up: a message taken out of the flow lets the ones under it move up, so the lowest goes first.
    for (const item of staying.slice(Math.max(0, VISIBLE - incoming)).reverse()) {
      leaving.add(item);
      const presence = item instanceof HTMLElement ? getMotion(item, 'presence') : undefined;
      if (!presence) {
        item.remove();
        continue;
      }
      void presence.setPresent(false).then(() => {
        leaving.delete(item);
        if (mounted) item.remove();
      });
    }
  }

  function add(count: number): void {
    makeRoom(count);
    const items = Array.from({ length: count }, () =>
      createInboxItem(next++, `${inboxMotion(origin, stagger, exit)} reflow`, 'now'),
    );
    // Inserted in one task: they cascade in, in visual order from the chosen origin.
    list!.prepend(...items);
  }

  /** An option changed: the readout names it, and the controls render the new options from the state. */
  function changed(): void {
    describe();
    state.publish();
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const addButton = target?.closest<HTMLElement>('[data-inbox-add]');
    if (addButton) {
      add(Number(addButton.dataset.inboxAdd));
      return;
    }
    const originChip = target?.closest<HTMLElement>('[data-inbox-origin]');
    if (originChip) {
      origin = originChip.dataset.inboxOrigin as InboxOrigin;
      return changed();
    }
    const staggerChip = target?.closest<HTMLElement>('[data-inbox-stagger]');
    if (staggerChip) {
      stagger = staggerChip.dataset.inboxStagger as InboxStagger;
      return changed();
    }
    const exitChip = target?.closest<HTMLElement>('[data-inbox-exit]');
    if (exitChip) {
      exit = exitChip.dataset.inboxExit as InboxExit;
      changed();
    }
  };
  root.addEventListener('click', onClick);

  // A swiped message ends out of sight, aria-hidden: it leaves the list, and its neighbours close the gap.
  const swiped = new MutationObserver((records) => {
    for (const { target: item } of records) {
      if (!(item instanceof HTMLElement) || item.parentElement !== list) continue;
      if (item.getAttribute('aria-hidden') !== 'true') continue;
      // Focus would be lost with the message: it moves to the one that takes its place.
      const neighbour = (item.nextElementSibling ?? item.previousElementSibling) as HTMLElement | null;
      const hadFocus = item.contains(document.activeElement);
      item.remove();
      if (hadFocus) neighbour?.focus();
    }
  });
  swiped.observe(list, { subtree: true, attributes: true, attributeFilter: ['aria-hidden'] });

  return () => {
    mounted = false;
    root.removeEventListener('click', onClick);
    swiped.disconnect();
    state.stop();
  };
}
