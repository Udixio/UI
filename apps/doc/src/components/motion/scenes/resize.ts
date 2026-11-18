/**
 * The "Move to a new place" scene: a card that widens, a pill that moves between the start and the end of its row, and a
 * list that shuffles. The card's width is an inline style, which the layout does not observe: after the change the scene
 * asks for the move with `play()`. The row's `data-end` and the list's order are observed on their own. Markup:
 * `Resize.astro`, controls: `ResizeControls.astro`. Shared by the root-page tile and the hero of /motion/layout.
 */
import { getMotion, loadLayoutEngine } from '@udixio/motion';

/** Shuffles the children of `list` into an order they did not have. */
function shuffle(list: HTMLElement): void {
  const items = [...list.children];
  if (items.length < 2) return;
  const before = items.map((item) => item.textContent).join('|');
  for (let attempt = 0; attempt < 8; attempt++) {
    const order = [...items].sort(() => Math.random() - 0.5);
    list.append(...order);
    if (order.map((item) => item.textContent).join('|') !== before) return;
  }
}

export function mount(root: HTMLElement): () => void {
  const card = root.querySelector<HTMLElement>('[data-resize-card]');
  const row = root.querySelector<HTMLElement>('[data-resize-row]');
  const list = root.querySelector<HTMLElement>('[data-resize-list]');
  if (!card || !row || !list) return () => {};

  // A change made before the layout engine is loaded does not move: load it now.
  void loadLayoutEngine();
  let wide = false;

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-resize-widen]')) {
      wide = !wide;
      card!.style.width = wide ? '100%' : '';
      getMotion(card!, 'layout')?.play();
      return;
    }
    if (target?.closest('[data-resize-align]')) {
      row!.toggleAttribute('data-end');
      return;
    }
    if (target?.closest('[data-resize-shuffle]')) {
      shuffle(list!);
      return;
    }
    const rotate = target?.closest('[data-resize-rotate]');
    const first = list!.firstElementChild;
    if (rotate && first) list!.append(first);
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
