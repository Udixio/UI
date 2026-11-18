/**
 * The hero of /motion/getting-started: Show a card inserts a notification with the slide preset. An element inserted after
 * the runtime connects plays its entry, and the oldest card leaves (its exit plays, then it is removed) when three are
 * showing. Markup: `Start.astro`; controls: `StartControls.astro`.
 */
import { getMotion } from '@udixio/motion';

const TITLES = ['Release is ready', 'New comment', 'Invoice paid', 'Review requested'];
/** How many cards the stack shows at once. */
const SHOWING = 3;

export function mount(root: HTMLElement): () => void {
  const stack = root.querySelector<HTMLElement>('[data-start-stack]');
  const template = root.querySelector<HTMLTemplateElement>('[data-start-template]');
  if (!stack || !template) return () => {};
  const leaving = new WeakSet<Element>();
  let added = 0;

  const showCard = () => {
    const card = (template.content.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
    const title = TITLES[added % TITLES.length]!;
    added += 1;
    card.querySelector<HTMLElement>('[data-start-title]')!.textContent = title;
    card.querySelector<HTMLElement>('[data-start-initial]')!.textContent = title.charAt(0);

    // New cards go on top, so the oldest one is the last that is not leaving.
    const showing = [...stack.children].filter((child) => !leaving.has(child));
    const oldest = showing.length >= SHOWING ? showing[showing.length - 1] : undefined;
    if (oldest instanceof HTMLElement) {
      leaving.add(oldest);
      const presence = getMotion(oldest, 'presence');
      if (presence) void presence.setPresent(false).then(() => oldest.remove());
      else oldest.remove();
    }
    stack.prepend(card);
  };

  const onClick = (event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest('[data-start-add]')) showCard();
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
