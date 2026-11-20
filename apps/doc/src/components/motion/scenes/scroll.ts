/**
 * The "Scroll to a target" scene: a box with five sections, and buttons 1 to 5 that scroll the box to a section over a
 * spring, focusing its heading. The visitor's own scrolling stops the move. Markup: `Scroll.astro`, whose buttons are Udixio
 * Buttons (`ScrollControls.tsx`, which keeps no state). The hero of /motion/scroll.
 */
import { scrollTo } from '@udixio/motion/scroll';

export function mount(root: HTMLElement): () => void {
  const box = root.querySelector<HTMLElement>('[data-scroll-box]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-scroll-go]')];
  if (!box || buttons.length === 0) return () => {};

  const onClick = (event: MouseEvent) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-scroll-go]') : null;
    if (!button) return;
    const section = box.querySelector<HTMLElement>(`#${CSS.escape(button.dataset.scrollGo ?? '')}`);
    if (section) void scrollTo(section, { container: box, focus: true }).finished;
  };
  root.addEventListener('click', onClick);

  return () => root.removeEventListener('click', onClick);
}
