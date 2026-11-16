import { useCallback, useRef, type RefCallback } from 'react';
import {
  gesturesModule,
  loadGestures,
  onGestureDefined,
  resolveGesture,
  type GestureBinding,
  type GestureRef,
} from '@udixio/motion';

export interface UseMotionGestureHandlers {
  /** Called when a drag is released and has come to rest. The event's `detail` is the offset `{ x, y }` it came to rest at. */
  onDragEnd?: (event: CustomEvent<{ x: number; y: number }>) => void;
  /** Called with each swipe. Calling `event.preventDefault()` keeps the element in place; removing it from the list needs no prevention. */
  onSwipe?: (event: CustomEvent<{ direction: 'start' | 'end' }>) => void;
  /** Called with each reorder step, before the element moves. Calling `event.preventDefault()` keeps the order as it is. */
  onReorder?: (event: CustomEvent<{ from: number; to: number }>) => void;
}

export interface UseMotionGestureReturn<T extends HTMLElement> {
  /** Put it on the element the gesture moves. */
  ref: RefCallback<T>;
  /** Puts the element back at offset 0, with the release spring. Does nothing before the element is attached. */
  reset: () => void;
  /** The binding of the element, or undefined before it is attached and while the gesture name is undefined. */
  getBinding: () => GestureBinding | undefined;
}

/**
 * Binds a gesture to an element now, or as soon as the named gesture is defined, once the gestures module is loaded: until
 * then the element is not touched, so a render never throws because of a gesture. Returns the function that destroys the
 * binding.
 */
function bindGestureWhenDefined(
  target: HTMLElement,
  source: GestureRef | string,
  onBound: (binding: GestureBinding) => void,
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
    onBound(binding);
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
 * Gives an element a gesture of `@udixio/motion`: a drag that follows the pointer, a swipe that flies away, or a reorder
 * among its siblings, with its keyboard alternative. The events of the gesture reach the handlers given here; the
 * handlers are read when an event arrives, so a new function never binds the element again.
 *
 * @example
 * ```tsx
 * // A row that is swiped away removes itself from the list; a reorder step moves the item in the state.
 * const dismiss = useMotionGesture<HTMLLIElement>('swipe-dismiss', {
 *   onSwipe: () => setItems(items => items.filter(item => item.id !== id)),
 * });
 * return <li ref={dismiss.ref}>{label}</li>;
 * ```
 *
 * @example
 * ```tsx
 * // A reorder list: preventing the move keeps the DOM as it is, and the state moves the item, so React renders the new order
 * // and the layout motion animates it.
 * const row = useMotionGesture<HTMLLIElement>('reorder-row', {
 *   onReorder: (event) => {
 *     event.preventDefault();
 *     setItems(items => moveItem(items, event.detail.from, event.detail.to));
 *   },
 * });
 * return <li ref={row.ref}>{label}</li>;
 * ```
 */
export function useMotionGesture<T extends HTMLElement = HTMLElement>(
  source: GestureRef | string,
  handlers: UseMotionGestureHandlers = {},
): UseMotionGestureReturn<T> {
  // A change of the name is a change of the binding: React makes a new callback, detaches the old one and attaches again.
  const key = typeof source === 'string' ? source : source.name;
  const latest = useRef(source);
  latest.current = source;
  const latestHandlers = useRef(handlers);
  latestHandlers.current = handlers;
  const bound = useRef<GestureBinding | undefined>(undefined);

  const ref = useCallback(
    (element: T | null) => {
      if (!element) return;
      const onDragEnd = (event: Event) =>
        latestHandlers.current.onDragEnd?.(event as CustomEvent<{ x: number; y: number }>);
      const onSwipe = (event: Event) =>
        latestHandlers.current.onSwipe?.(event as CustomEvent<{ direction: 'start' | 'end' }>);
      const onReorder = (event: Event) =>
        latestHandlers.current.onReorder?.(event as CustomEvent<{ from: number; to: number }>);
      element.addEventListener('motion-dragend', onDragEnd);
      element.addEventListener('motion-swipe', onSwipe);
      element.addEventListener('motion-reorder', onReorder);
      const destroy = bindGestureWhenDefined(element, latest.current, (binding) => {
        bound.current = binding;
      });
      return () => {
        element.removeEventListener('motion-dragend', onDragEnd);
        element.removeEventListener('motion-swipe', onSwipe);
        element.removeEventListener('motion-reorder', onReorder);
        bound.current = undefined;
        destroy();
      };
    },
    [key],
  );

  const reset = useCallback(() => {
    bound.current?.reset();
  }, []);

  const getBinding = useCallback(() => bound.current, []);

  return { ref, reset, getBinding };
}
