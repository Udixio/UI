/** The messages and the look of the inbox scene, shared by its markup (`Inbox.astro`) and its module (`inbox.ts`). */

export type InboxMessage = { name: string; text: string };

/** The messages in order: those of `INBOX_INITIAL` are in the page at load, the next ones arrive with Add. */
export const INBOX_MESSAGES: InboxMessage[] = [
  { name: 'Ada', text: 'Your build passed' },
  { name: 'Lin', text: 'Requested your review on #482' },
  { name: 'Mo', text: 'Deploy finished in 42 s' },
  { name: 'Ines', text: 'Commented on Tabs' },
  { name: 'Kai', text: 'Release 2.4 is ready' },
  { name: 'Zoé', text: 'Design review moved to 3 pm' },
  { name: 'Noor', text: 'Merged motion-tokens' },
  { name: 'Theo', text: 'Invited you to Roadmap' },
  { name: 'Sam', text: 'Your export is ready' },
];

/** The messages in the page at load, newest first, with how long ago they arrived. */
export const INBOX_INITIAL: { index: number; time: string }[] = [
  { index: 4, time: '2 min' },
  { index: 3, time: '9 min' },
  { index: 2, time: '24 min' },
  { index: 1, time: '1 h' },
  { index: 0, time: '3 h' },
];

/** The avatar colours, in turn: role containers with their on- colour. */
export const INBOX_TINTS = [
  'bg-primary-container text-on-primary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-secondary-container text-on-secondary-container',
];

/** The options of the cascade: where it starts, the step between its elements, and what a leaving message does. */
export const INBOX_ORIGINS = ['first', 'center', 'last'] as const;
export const INBOX_STAGGERS = ['tight', 'normal', 'loose'] as const;
export const INBOX_EXITS = ['in-place', 'out-of-flow'] as const;
export type InboxOrigin = (typeof INBOX_ORIGINS)[number];
export type InboxStagger = (typeof INBOX_STAGGERS)[number];
export type InboxExit = (typeof INBOX_EXITS)[number];

/**
 * A message that is leaving (`data-motion-presence="exiting"`) is painted under the messages around it, and its text fades faster
 * than its surface (90 ms, linear), so that no text shows between two moving messages.
 */
export const inboxItemClass =
  'grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-surface-container-high py-2.5 pl-3 pr-4 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface touch-pan-y select-none data-[motion-presence=exiting]:z-[-1] data-[motion-presence=exiting]:*:opacity-0 data-[motion-presence=exiting]:*:[transition:opacity_90ms_linear]';
export const inboxAvatarClass = 'grid size-9 place-items-center rounded-full text-title-small';
/** The first line of a message: the name, and the time at the end. */
export const inboxHeadClass = 'flex items-baseline justify-between gap-2';
export const inboxNameClass = 'min-w-0 truncate text-title-small text-on-surface';
export const inboxTextClass = 'block truncate text-body-small text-on-surface-variant';
export const inboxTimeClass = 'flex-none text-label-small text-on-surface-variant';

/** One message of the list, as the module inserts it: the same structure as the markup's. */
export function createInboxItem(index: number, motion: string, time: string): HTMLLIElement {
  const { name, text } = INBOX_MESSAGES[index % INBOX_MESSAGES.length];
  const item = document.createElement('li');
  item.className = inboxItemClass;
  item.tabIndex = 0;
  item.dataset.motion = motion;
  item.dataset.motionGesture = 'dismiss';

  const avatar = document.createElement('span');
  avatar.className = `${inboxAvatarClass} ${INBOX_TINTS[index % INBOX_TINTS.length]}`;
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = name[0];

  const body = document.createElement('span');
  body.className = 'min-w-0';
  const head = document.createElement('span');
  head.className = inboxHeadClass;
  const nameEl = document.createElement('span');
  nameEl.className = inboxNameClass;
  nameEl.textContent = name;
  const timeEl = document.createElement('span');
  timeEl.className = inboxTimeClass;
  timeEl.textContent = time;
  head.append(nameEl, timeEl);
  const textEl = document.createElement('span');
  textEl.className = inboxTextClass;
  textEl.textContent = text;
  body.append(head, textEl);

  item.append(avatar, body);
  return item;
}
