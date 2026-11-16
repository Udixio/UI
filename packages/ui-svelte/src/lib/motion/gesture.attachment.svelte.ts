import {
  gesturesModule,
  loadGestures,
  onGestureDefined,
  resolveGesture,
  type GestureBinding,
  type GestureRef,
} from '@udixio/motion';
import type { Attachment } from 'svelte/attachments';
import type { MotionGestureAttachmentOptions } from './motion.types';

/**
 * Binds a gesture to an element now, or as soon as the named gesture is defined, once the gestures module is loaded: until
 * then the element is not touched, so a render never throws because of a gesture. Returns the function that destroys the
 * binding.
 */
function bindGestureWhenDefined(
  target: HTMLElement,
  source: GestureRef | string,
): () => void {
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
    binding = api.gesture(target, ref);
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
 * <!-- A swiped row removes itself from the list. -->
 * <li {@attach motionGesture('swipe-dismiss', () => ({ onSwipe: () => remove(item) }))}>{item.label}</li>
 *
 * <!-- A reorder list: preventing the move keeps the DOM as it is, and the state moves the item, so Svelte renders the new
 * order and the layout motion animates it. -->
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
    const destroy = bindGestureWhenDefined(target, source);
    return () => {
      target.removeEventListener('motion-dragend', onDragEnd);
      target.removeEventListener('motion-swipe', onSwipe);
      target.removeEventListener('motion-reorder', onReorder);
      destroy();
    };
  };
}
