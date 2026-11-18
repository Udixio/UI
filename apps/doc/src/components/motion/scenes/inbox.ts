/**
 * The "Make a list appear" scene: a notification list. Messages added together cascade in from the chosen origin; past
 * five, the oldest leave out of the flow while their neighbours close the gap; a message is swiped away, or focused and
 * deleted. Markup: `Inbox.astro`. Shared by the root-page tile and the hero of /motion/lists.
 */
import { defineMotion, getMotion, loadLayoutEngine } from '@udixio/motion';
import { defineGesture } from '@udixio/motion/gesture';
import { createInboxItem } from './data/inbox';

export const INBOX_ORIGINS = ['first', 'center', 'last'] as const;
type Origin = (typeof INBOX_ORIGINS)[number];

for (const origin of INBOX_ORIGINS) {
  defineMotion(`inbox-${origin}`, {
    verb: 'appear',
    stagger: 'normal',
    origin,
    exit: 'out-of-flow',
    keyframes: [
      { opacity: 0, y: -16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1 },
    ],
  });
}
defineGesture('dismiss', { kind: 'swipe', alternative: 'action' });

/** The list shows this many messages; the oldest leave beyond it. */
const VISIBLE = 5;

export function mount(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLUListElement>('[data-inbox-list]');
  if (!list) return () => {};
  const originButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-inbox-origin]')];
  const readout = root.querySelector<HTMLElement>('[data-inbox-readout]');

  let origin: Origin = 'first';
  let next = Number(list.dataset.inboxNext ?? 0);
  const leaving = new Set<Element>();
  let mounted = true;

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();

  // The messages of the page take their presence and their gesture now that both are defined: bound settled, they play
  // no entry.
  for (const item of list.children) {
    if (!(item instanceof HTMLElement)) continue;
    item.dataset.motion = `inbox-${origin} reflow`;
    item.dataset.motionGesture = 'dismiss';
  }

  /**
   * Makes room for `incoming` messages: the oldest beyond the visible count leave first, out of the flow where they
   * stand, so that they fade inside the list while the others move down past them.
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
    const items = Array.from({ length: count }, () => createInboxItem(next++, `inbox-${origin} reflow`, 'now'));
    // Inserted in one task: they cascade in, in visual order from the chosen origin.
    list!.prepend(...items);
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
      for (const button of originButtons) button.setAttribute('aria-pressed', String(button === originButton));
      if (readout) readout.textContent = `origin: '${origin}'`;
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
