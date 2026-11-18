/**
 * The "Make a list appear" scene: a notification list. Messages added together cascade in from the chosen origin, at the
 * chosen stagger; past five, the oldest leave out of the flow (or in place) while their neighbours close the gap; a message
 * is swiped away, or focused and deleted. Markup: `Inbox.astro`; controls: `InboxControls.astro`. Shared by the root-page
 * tile and the hero of /motion/lists, which also offers the stagger and the exit.
 */
import { defineMotion, getMotion, loadLayoutEngine } from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import { createInboxItem } from './data/inbox';

export const INBOX_ORIGINS = ['first', 'center', 'last'] as const;
export const INBOX_STAGGERS = ['tight', 'normal', 'loose'] as const;
export const INBOX_EXITS = ['in-place', 'out-of-flow'] as const;
type Origin = (typeof INBOX_ORIGINS)[number];
type Stagger = (typeof INBOX_STAGGERS)[number];
type Exit = (typeof INBOX_EXITS)[number];

/** The name of the motion of a new message, for each origin, stagger and exit: one definition per combination. */
export const inboxMotion = (origin: Origin, stagger: Stagger, exit: Exit): string => `inbox-${origin}-${stagger}-${exit}`;

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
defineGesture('dismiss', { kind: 'swipe', alternative: 'action' });

/** The list shows this many messages; the oldest leave beyond it. */
const VISIBLE = 5;

export function mount(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLUListElement>('[data-inbox-list]');
  if (!list) return () => {};
  const readout = root.querySelector<HTMLElement>('[data-inbox-readout]');
  // The page offers the stagger and the exit too: the readout then names all three.
  const offersAll = root.querySelector('[data-inbox-stagger]') !== null;

  let origin: Origin = 'first';
  let stagger: Stagger = 'normal';
  let exit: Exit = 'out-of-flow';
  let next = Number(list.dataset.inboxNext ?? 0);
  const leaving = new Set<Element>();
  let mounted = true;

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


  /** A group of options: its buttons take the pressed state, and the value of the option is the one of the button. */
  function choose(group: HTMLElement, button: HTMLButtonElement): void {
    for (const each of group.querySelectorAll<HTMLButtonElement>('button')) {
      each.setAttribute('aria-pressed', String(each === button));
    }
  }

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const addButton = target?.closest<HTMLButtonElement>('[data-inbox-add]');
    if (addButton) {
      add(Number(addButton.dataset.inboxAdd));
      return;
    }
    const originButton = target?.closest<HTMLButtonElement>('[data-inbox-origin]');
    if (originButton) {
      origin = originButton.dataset.inboxOrigin as Origin;
      choose(originButton.parentElement!, originButton);
      describe();
      return;
    }
    const staggerButton = target?.closest<HTMLButtonElement>('[data-inbox-stagger]');
    if (staggerButton) {
      stagger = staggerButton.dataset.inboxStagger as Stagger;
      choose(staggerButton.parentElement!, staggerButton);
      describe();
      return;
    }
    const exitButton = target?.closest<HTMLButtonElement>('[data-inbox-exit]');
    if (exitButton) {
      exit = exitButton.dataset.inboxExit as Exit;
      choose(exitButton.parentElement!, exitButton);
      describe();
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
  };
}
