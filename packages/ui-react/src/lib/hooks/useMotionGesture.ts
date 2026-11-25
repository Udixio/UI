import { useCallback, useRef, type RefCallback } from 'react';
import {
  gesturesModule,
  hasNoBox,
  loadGestures,
  motionBox,
  onGestureDefined,
  resolveGesture,
  type GestureBinding,
  type GestureOptions,
  type GestureRef,
} from '@udixio/motion';

/** The events of a gesture, as `useMotionGesture` and the `onMotion*` props of `Motion` take them. */
export interface UseMotionGestureHandlers {
  /** Called when a drag is released and has come to rest. The event's `detail` is the offset `{ x, y }` it came to rest at. */
  onDragEnd?: (event: CustomEvent<{ x: number; y: number }>) => void;
  /** Called with each swipe. Calling `event.preventDefault()` keeps the element in place; removing it from the list needs no prevention. */
  onSwipe?: (event: CustomEvent<{ direction: 'start' | 'end' }>) => void;
  /** Called with each reorder step, before the element moves. Calling `event.preventDefault()` keeps the order as it is. */
  onReorder?: (event: CustomEvent<{ from: number; to: number }>) => void;
}

/** The options of `useMotionGesture`: the events of the gesture, and where a swipe sends the focus it holds. */
export interface UseMotionGestureOptions extends UseMotionGestureHandlers {
  /**
   * Where focus goes when a swipe flies out with focus inside the element (WCAG 2.4.3): an element, or a function that gives
   * one then; `false` leaves focus where it is. Without one, focus moves to the next sibling with the same gesture, else the
   * previous one, else the parent. Read when the swipe flies out.
   */
  restoreFocus?: GestureOptions['restoreFocus'];
}

/** What `useMotionGesture` returns: the ref of the moved element, and its binding. */
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
 * then the element is not touched, so a render never throws because of a gesture. An element declared with no box moves its
 * box, so the gesture is bound again when a new box is rendered in place of the old one, as the motions and the HTML scanner
 * are. Returns the function that destroys the binding.
 */
function bindGestureWhenDefined(
  target: HTMLElement,
  source: GestureRef | string,
  options: GestureOptions,
  onBound: (binding: GestureBinding) => void,
): () => void {
  let binding: GestureBinding | undefined;
  let stopWaiting: (() => void) | undefined;
  let cancelled = false;
  // The gesture moves the box it found when it bound: `box` is that box, and `watcher` binds again when it is another one.
  let bound: GestureRef | string = source;
  let box: Element | undefined;
  let watcher: MutationObserver | undefined;
  const followBox = () => {
    if (cancelled || !binding || motionBox(target) === box) return;
    binding.destroy();
    binding = undefined;
    bind(bound);
  };
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
    bound = ref;
    binding = api.gesture(target, ref, options);
    box = motionBox(target);
    onBound(binding);
    if (!watcher && hasNoBox(target)) {
      watcher = new MutationObserver(followBox);
      watcher.observe(target, { childList: true, subtree: true });
    }
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
    watcher?.disconnect();
    watcher = undefined;
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
 * // A row that is swiped away removes itself from the list; focus held in it moves to the next row by itself.
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
  handlers: UseMotionGestureOptions = {},
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
      // The option is read when a swipe flies out, so a new value or function never binds the element again.
      const restoreFocus = () => {
        const given = latestHandlers.current.restoreFocus;
        return typeof given === 'function' ? given() : given;
      };
      const destroy = bindGestureWhenDefined(element, latest.current, { restoreFocus }, (binding) => {
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
