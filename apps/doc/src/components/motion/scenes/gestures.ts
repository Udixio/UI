/**
 * The "Drag, swipe, reorder" scene: a board of four tasks. Three of them reorder among each other, by drag or by Space and
 * the arrows; the fourth is swiped away to complete it, or focused and deleted, and Restore brings it back. On a need page
 * a sticker can be thrown inside the board, with the arrow keys as its alternative. The last event is written in the
 * readout. Markup: `Gestures.astro`. Its Restore button is `GesturesControls.tsx`, a static Udixio Button that the scene
 * listens to on the stage, so the scene publishes no state. Shared by the root-page tile and the hero of
 * /motion/gestures.
 */
import { defineGesture, getGesture } from '@udixio/motion/gesture';

defineGesture('reorder', { kind: 'reorder', alternative: 'grab' });
defineGesture('complete', { kind: 'swipe', alternative: 'action' });
defineGesture('sticker-throw', { kind: 'drag', alternative: 'arrows', timing: 'spring.slow.spatial' });

export function mount(root: HTMLElement): () => void {
  const list = root.querySelector<HTMLElement>('[data-gestures-list]');
  const card = root.querySelector<HTMLElement>('[data-gestures-card]');
  const done = root.querySelector<HTMLElement>('[data-gestures-done]');
  const restore = root.querySelector<HTMLButtonElement>('[data-gestures-restore]');
  const sticker = root.querySelector<HTMLElement>('[data-gestures-sticker]');
  const readouts = [...root.querySelectorAll<HTMLElement>('[data-gestures-readout]')];
  if (!list || !card || !done || !restore) return () => {};

  // The gestures are named now that they are defined: a binding made at load would wait for them.
  const tasks = [...list.children] as HTMLElement[];
  for (const task of tasks) task.dataset.motionGesture = 'reorder';
  card.dataset.motionGesture = 'complete';
  if (sticker) sticker.dataset.motionGesture = 'sticker-throw';

  const show = (text: string) => {
    for (const readout of readouts) readout.textContent = text;
  };

  // A reorder step names its positions, counted from one as the visitor reads them.
  const onReorder = (event: Event) => {
    const { from, to } = (event as CustomEvent<{ from: number; to: number }>).detail;
    show(`motion-reorder ${from + 1} → ${to + 1}`);
  };
  const onSwipe = (event: Event) => {
    show(`motion-swipe ${(event as CustomEvent<{ direction: string }>).detail.direction}`);
  };
  const onDragEnd = (event: Event) => {
    const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail;
    show(`motion-dragend ${Math.round(x)}, ${Math.round(y)}`);
  };
  const onRestore = () => {
    // The tasks go back to their order; the card comes back from the side it left by, and the sticker returns to its place.
    list.append(...tasks);
    card.hidden = false;
    done.hidden = true;
    getGesture(card)?.reset();
    if (sticker) getGesture(sticker)?.reset();
    show('restored');
  };

  // A swiped card ends out of sight with aria-hidden: the scene keeps its place as a note, and moves focus to Restore.
  const gone = new MutationObserver(() => {
    if (card.getAttribute('aria-hidden') !== 'true' || card.hidden) return;
    const hadFocus = card.contains(document.activeElement);
    card.hidden = true;
    done.hidden = false;
    if (hadFocus) restore.focus();
  });
  gone.observe(card, { attributes: true, attributeFilter: ['aria-hidden'] });

  list.addEventListener('motion-reorder', onReorder);
  card.addEventListener('motion-swipe', onSwipe);
  sticker?.addEventListener('motion-dragend', onDragEnd);
  restore.addEventListener('click', onRestore);

  return () => {
    gone.disconnect();
    list.removeEventListener('motion-reorder', onReorder);
    card.removeEventListener('motion-swipe', onSwipe);
    sticker?.removeEventListener('motion-dragend', onDragEnd);
    restore.removeEventListener('click', onRestore);
  };
}
