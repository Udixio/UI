import {
  gesturesModule,
  loadGestures,
  onGestureDefined,
  resolveGesture,
  type GestureBinding,
  type GestureOptions,
  type GestureRef,
} from '@udixio/motion';
import type { Attachment } from 'svelte/attachments';
import type { MotionGestureAttachmentOptions } from './motion.types';

/**
 * Binds a gesture to an element now, or as soon as the named gesture is defined, once the gestures module is loaded: until
 * then the element is not touched, so a render never throws because of a gesture. The binding follows the box of an element
 * declared with no box: when that box is replaced, the gesture moves to the new one in the binding itself, which stays the same.
 * Returns the function that destroys the binding.
 */
function bindGestureWhenDefined(target: HTMLElement, source: GestureRef | string, options: GestureOptions): () => void {
  let binding: GestureBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  const bind = (ref: GestureRef | string) => {
    const api = gesturesModule();
    if (!api) {
      // The module loads once per page; a binding released before it arrives never binds.
      void loadGestures().then(
        () => {
          if (!cancelled) bind(ref);
        },
        () => {},
      );
      return;
    }
    binding = api.gesture(target, ref, options);
  };
  if (typeof source === 'string' && !resolveGesture(source)) {
    stopWaiting = onGestureDefined((ref) => {
      if (ref.name !== source) return;
      stopWaiting?.();
      stopWaiting = undefined;
      bind(ref);
    });
  } else {
    bind(source);
  }
  return () => {
    cancelled = true;
    stopWaiting?.();
    stopWaiting = undefined;
    binding?.destroy();
    binding = undefined;
  };
}

/**
 * Gives the element it is placed on a gesture of `@udixio/motion`: a drag that follows the pointer, a swipe that flies
 * away, or a reorder among its siblings, with its keyboard alternative. The handlers are read through a getter when an
 * event arrives, so a new handler receives the next events without binding the element again.
 *
 * ```svelte
 * <!-- A swiped row removes itself from the list; focus held in it moves to the next row by itself. -->
 * <li {@attach motionGesture('swipe-dismiss', () => ({ onSwipe: () => remove(item) }))}>{item.label}</li>
 *
 * <!-- A reorder list: preventDefault() means the state renders the step, so the state moves the item and Svelte renders the
 * new order, which the layout motion animates. -->
 * <li {@attach motionGesture('reorder-row', () => ({
 *   onReorder: (event) => { event.preventDefault(); moveItem(event.detail.from, event.detail.to); },
 * }))}>{item.label}</li>
 * ```
 */
export function motionGesture(
  source: GestureRef | string,
  options: () => MotionGestureAttachmentOptions = () => ({}),
): Attachment<HTMLElement> {
  return (target) => {
    const onDragEnd = (event: Event) => options().onDragEnd?.(event as CustomEvent<{ x: number; y: number }>);
    const onSwipe = (event: Event) => options().onSwipe?.(event as CustomEvent<{ direction: 'start' | 'end' }>);
    const onReorder = (event: Event) => options().onReorder?.(event as CustomEvent<{ from: number; to: number }>);
    target.addEventListener('motion-dragend', onDragEnd);
    target.addEventListener('motion-swipe', onSwipe);
    target.addEventListener('motion-reorder', onReorder);
    // Read when a swipe flies out, so a new value never binds the element again.
    const restoreFocus = () => {
      const given = options().restoreFocus;
      return typeof given === 'function' ? given() : given;
    };
    const destroy = bindGestureWhenDefined(target, source, { restoreFocus });
    return () => {
      target.removeEventListener('motion-dragend', onDragEnd);
      target.removeEventListener('motion-swipe', onSwipe);
      target.removeEventListener('motion-reorder', onReorder);
      destroy();
    };
  };
}
