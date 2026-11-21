import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ElementType,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import type {
  GestureRef,
  MotionElement,
  MotionSource,
} from '@udixio/motion';
import {
  useMotion,
  type UseMotionOptions,
} from '../hooks/useMotion';
import {
  useMotionGesture,
  type UseMotionGestureHandlers,
} from '../hooks/useMotionGesture';
import {
  PresenceChildContext,
  PresenceRegistryContext,
  type PresenceSlot,
} from './presence-context';

/** The elements a `Motion` can render: the intrinsic ones, whose props it takes. */
export type MotionTag = keyof JSX.IntrinsicElements;

/** The props `Motion` adds to the props of its element. */
export interface MotionOwnProps {
  /**
   * The motion of the element: a defined name, a definition, or a list of them. A string of names separated by spaces is
   * several names, so `name="inbox reflow"` holds a presence and a layout. Optional: an element that holds only a gesture
   * takes none.
   */
  name?: MotionSource | readonly MotionSource[];
  /**
   * Whether the element is present: it enters when this turns true and exits when it turns false. Given, the element stays in
   * the DOM: it is rendered `hidden` while absent, from the server HTML on, it stays displayed while its exit plays, and it is
   * shown again with its entry, as an HTML element with `hidden` and `data-motion` is. Its content, links and text stay
   * indexable: use it for navigation and content (menus, tab panels, accordions). Default: true. Inside a `Presence`, the
   * presence of the child applies as well, so this prop can only take the presence away, and a child that leaves the
   * `Presence` is still removed once its exit has played.
   */
  present?: boolean;
  /** An emphasis replays each time this value changes. */
  state?: unknown;
  /** Treats the element as already in place: no entry. Default: true when hydrating server content. */
  settled?: boolean;
  /** The shared identity of the element: a layout motion morphs from the place of another element that held the same key. */
  shared?: string;
  /** Pauses a loop while true, and plays it again when false. Ignored without a loop. */
  paused?: boolean;
  /** Where focus goes when an exit starts with focus inside the element (WCAG 2.4.3). */
  restoreFocus?: UseMotionOptions['restoreFocus'];
  /**
   * A gesture of `@udixio/motion`, bound to the same element: a drag, a swipe or a reorder, with its keyboard alternative.
   * Its events are the `onMotion*` props here, `udxDragEnd`, `udxSwipe` and `udxReorder` in Angular, and `onDragEnd`,
   * `onSwipe` and `onReorder` in `useMotionGesture` and in Svelte.
   */
  gesture?: GestureRef | string;
  /** Called when a drag of the gesture is released and has come to rest. */
  onMotionDragEnd?: UseMotionGestureHandlers['onDragEnd'];
  /** Called with each swipe of the gesture. Calling `event.preventDefault()` keeps the element in place. */
  onMotionSwipe?: UseMotionGestureHandlers['onSwipe'];
  /** Called with each reorder step of the gesture, before the element moves. Calling `event.preventDefault()` keeps the order. */
  onMotionReorder?: UseMotionGestureHandlers['onReorder'];
}

/** The props of `Motion`: its own, and the props of the element it renders (`as`). */
export type MotionProps<T extends MotionTag = 'div'> = MotionOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof MotionOwnProps> & {
    /** The element to render: a `div` by default. Its props are the props of that element. */
    as?: T;
    /** The element the motions bind to, as a ref to an element. */
    ref?: Ref<ComponentRef<T>>;
  };

/** A gesture that is not given: its hook is called, and binds nothing, since its `ref` is never attached. */
const NO_GESTURE = '';
/** No motion: an element that holds only a gesture, or nothing, binds no motion. */
const NO_MOTIONS: readonly MotionSource[] = [];

/**
 * Attaches an element to a ref, and returns what detaches it: the cleanup of a callback ref, else the call with `null`, as
 * React 19 does for a ref that returns nothing.
 */
function attachRef<T>(ref: Ref<T> | undefined, element: T): (() => void) | undefined {
  if (typeof ref === 'function') {
    const cleanup = ref(element);
    return typeof cleanup === 'function' ? cleanup : () => ref(null);
  }
  if (ref) {
    ref.current = element;
    return () => {
      ref.current = null;
    };
  }
  return undefined;
}

/**
 * Renders an element that holds a motion of `@udixio/motion`: `name` is what `useMotion` takes, and the element is `as` (a
 * `div` by default) with the props it takes. The motion binds to that element, and a `gesture` binds to the same element, so
 * one element can hold a presence, a layout and a gesture without merging refs. `present` plays the entry and the exit of
 * an element that stays in the DOM, `hidden` while absent; a `Presence` removes a child that leaves, once its exit has played.
 *
 * @example
 * ```tsx
 * <Motion as="li" name="rise">{title}</Motion>
 * ```
 *
 * @example
 * ```tsx
 * // A submenu that stays in the DOM, hidden while closed: its links are in the server HTML.
 * <Motion as="ul" name="fade" present={open}>{links}</Motion>
 * ```
 *
 * @example
 * ```tsx
 * // A card that is only dragged: it holds a gesture and no motion.
 * <Motion gesture="drag-card">{title}</Motion>
 * ```
 *
 * @example
 * ```tsx
 * // A row that follows its neighbours, and is reordered by a drag or by the keyboard.
 * <Motion
 *   as="li"
 *   name="reflow"
 *   gesture="reorder-row"
 *   onMotionReorder={(event) => {
 *     event.preventDefault();
 *     move(event.detail.from, event.detail.to);
 *   }}
 * >
 *   {label}
 * </Motion>
 * ```
 *
 * @devx
 * - For a replay, call `play()` from `useMotion`. A `ref` gives the element too, and `getMotion(element, 'emphasis')?.play()`
 *   from `@udixio/motion` replays it from there.
 * - Inside a `Presence`, the presence is the child's: a child that is removed plays its exit before it leaves.
 * - Transient UI (toasts, dialogs, list items) is rendered conditionally, in a `Presence`; navigation and content take
 *   `present`, so that they stay in the DOM.
 * - Without `present`, the element's own `hidden` prop is left to the author.
 * @limitations
 * - `name` is the motion of the element, so the element's own `name` attribute cannot be set with this component: a `ref` sets
 *   it.
 * - The element must take a `ref` that is a DOM element, as with `useMotion`.
 */
export function Motion<T extends MotionTag = 'div'>(props: MotionProps<T>): ReactNode {
  const {
    as: tag = 'div',
    name = NO_MOTIONS,
    present = true,
    state,
    settled,
    shared,
    paused,
    restoreFocus,
    gesture,
    onMotionDragEnd,
    onMotionSwipe,
    onMotionReorder,
    ref,
    ...rest
  } = props;
  const child = useContext(PresenceChildContext);
  const registry = useContext(PresenceRegistryContext);
  const inChild = child?.present ?? true;

  const motion = useMotion<MotionElement>(name, {
    present: present && inChild,
    state,
    settled,
    shared,
    paused,
    restoreFocus,
  });
  const gestured = gesture !== undefined;
  const drag = useMotionGesture<HTMLElement>(gesture ?? NO_GESTURE, {
    onDragEnd: onMotionDragEnd,
    onSwipe: onMotionSwipe,
    onReorder: onMotionReorder,
  });

  // The motions of a child report to its Presence whether their exits have played: the child goes once they all have.
  const key = child?.key;
  const exiting = !inChild && !motion.mounted;
  const slot = useRef<PresenceSlot | undefined>(undefined);
  useEffect(() => {
    if (key === undefined || registry === null) return undefined;
    const attached = registry.attach(key);
    slot.current = attached;
    return () => {
      attached.detach();
      slot.current = undefined;
    };
  }, [registry, key]);
  useEffect(() => {
    slot.current?.report(exiting);
  }, [exiting]);

  // The forwarded ref is read when the element attaches, so a new callback does not bind the element again.
  const forwarded = useRef(ref);
  forwarded.current = ref;
  const attach = useCallback(
    (element: MotionElement | null) => {
      if (element === null) return undefined;
      const detachers = [
        attachRef(motion.ref, element),
        gestured ? attachRef(drag.ref, element as HTMLElement) : undefined,
        attachRef(forwarded.current, element as ComponentRef<T>),
      ];
      return () => detachers.forEach((detach) => detach?.());
    },
    [motion.ref, drag.ref, gestured],
  );

  // With `present` given, the element stays in the DOM and `hidden` follows it: its content is in the server HTML. A child
  // that leaves its Presence is still removed once its exit has played.
  const kept = props.present !== undefined;
  if (!motion.mounted && !(kept && inChild)) return null;
  const Element = tag as ElementType;
  return <Element {...rest} hidden={kept && !present ? true : (rest as { hidden?: boolean }).hidden} ref={attach} />;
}
