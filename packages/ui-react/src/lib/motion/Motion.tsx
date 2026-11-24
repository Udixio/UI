import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ElementType,
  type JSX,
  type JSXElementConstructor,
  type ReactNode,
  type Ref,
} from 'react';
import type {
  GestureRef,
  MotionElement,
  MotionSource,
  SequenceStepName,
} from '@udixio/motion';
import {
  useMotion,
  type MotionControls,
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

/**
 * The elements a `Motion` can render: the intrinsic ones, or a component (TRIAL, review 5 Q3), whose props it takes. A
 * component is rendered inside a `<span data-motion-box="child">` that holds the motion: the core moves the first element
 * child of an element declared with no box, the component's root (or its direct child marked `data-motion-box`). The wrapper
 * carries the state (`hidden`, `data-motion-presence`, `inert`) and the root the pixels.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MotionTag = keyof JSX.IntrinsicElements | JSXElementConstructor<any>;

/** The props `Motion` adds to the props of its element. */
export interface MotionOwnProps {
  /**
   * The motion of the element: a defined name, a definition, or a list of them. A string of names separated by spaces is
   * several names, so `name="inbox reflow"` holds a presence and a layout. One motion of each kind: of two names of one
   * kind, the first listed is bound and the other is ignored, reported in development. Optional: an element that holds only
   * a gesture takes none.
   */
  name?: MotionSource | readonly MotionSource[];
  /**
   * Whether the element is present: it enters when this turns true and exits when it turns false. Given, the element stays in
   * the DOM: it is rendered `hidden` while absent, from the server HTML on, it stays displayed while its exit plays, and it is
   * shown again with its entry, as an HTML element with `hidden` and `data-motion` is. Its content, links and text stay
   * indexable: use it for navigation and content (menus, tab panels, accordions). On a component (`as={Card}`), the wrapper
   * is the element that is `hidden`, marked and `inert`, and the component's root is the one that moves: the component need
   * not forward `hidden`, and its own `hidden` prop stays its own. Default: true. Inside a `Presence`, the
   * presence of the child applies as well, so this prop can only take the presence away, and a child that leaves the
   * `Presence` is still removed once its exit has played.
   */
  present?: boolean;
  /**
   * Each change of this value calls `play()` without a kind: the first listed motion that is not a presence plays. So
   * `<Motion name="reflow" state={wide} style={{ width }}>` moves once the new width is applied.
   */
  state?: unknown;
  /**
   * The controls of the element's motions: `play(kind?)` and `getBinding(kind?)`, as `useMotion` returns them. `ref` stays
   * the element.
   */
  motionRef?: Ref<MotionControls>;
  /**
   * The step of a sequence this element is, in the sequence bound on an ancestor (`useMotionSequence`): written as its
   * `data-motion-step`. The step names that an app registers in `SequenceStepRegistry` autocomplete.
   */
  step?: SequenceStepName;
  /** Treats the element as already in place: no entry. Default: true when hydrating server content. */
  settled?: boolean;
  /** The shared identity of the element: a layout motion morphs from the place of another element that held the same key. */
  shared?: string;
  /** Pauses a loop while true, and plays it again when false. Ignored without a loop. */
  paused?: boolean;
  /**
   * Where focus goes when an exit starts, or a swipe of `gesture` flies out, with focus inside the element (WCAG 2.4.3): an
   * element, or a function that gives one then. `false` leaves focus where it is. Without it, an exit keeps the element
   * focusable until focus leaves it, and a swipe sends focus to the next sibling with the same gesture, else the previous
   * one, else the parent.
   */
  restoreFocus?: UseMotionOptions['restoreFocus'] | false;
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
    /**
     * The element to render: a `div` by default, or a component (`as={Button}`), which renders without a wrapper box. Its
     * props are the props of that element or component.
     */
    as?: T;
    /** The element the motions bind to, as a ref to an element; for a component, the component's own `ref`. */
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
 * @example
 * ```tsx
 * // A panel whose width changes: the change of `state` moves it once the new width is applied.
 * <Motion name="reflow" state={wide} style={{ width: wide ? 480 : 240 }} />
 * ```
 *
 * @example
 * ```tsx
 * // A replay from a control: `motionRef` gives the controls, `ref` the element.
 * const controls = useRef<MotionControls>(null);
 * <Motion name="press" motionRef={controls}>…</Motion>
 * <Button label="Replay" onClick={() => controls.current?.play()} />
 * ```
 *
 * @example
 * ```tsx
 * // The steps of a sequence bound on the section by `useMotionSequence('intro')`.
 * <section ref={intro.ref}>
 *   <Motion as="h2" step="title">{title}</Motion>
 *   <Motion as="p" step="body">{body}</Motion>
 * </section>
 * ```
 *
 * @devx
 * - `state` and `motionRef` play the motions as `useMotion` does: `play(kind?)` plays the binding of a kind, or without one
 *   the first listed motion that is not a presence.
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
    motionRef,
    step,
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
    restoreFocus: restoreFocus === false ? undefined : restoreFocus,
  });
  useImperativeHandle(motionRef, () => ({ play: motion.play, getBinding: motion.getBinding }), [motion.play, motion.getBinding]);
  const gestured = gesture !== undefined;
  const drag = useMotionGesture<HTMLElement>(gesture ?? NO_GESTURE, {
    onDragEnd: onMotionDragEnd,
    onSwipe: onMotionSwipe,
    onReorder: onMotionReorder,
    restoreFocus,
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
        // A component takes the ref itself: the wrapper is not the element.
        typeof tag === 'string' ? attachRef(forwarded.current, element as ComponentRef<T>) : undefined,
      ];
      return () => detachers.forEach((detach) => detach?.());
    },
    [motion.ref, drag.ref, gestured, tag],
  );

  // With `present` given, the element stays in the DOM and `hidden` follows it: its content is in the server HTML. A child
  // that leaves its Presence is still removed once its exit has played.
  const kept = props.present !== undefined;
  if (!motion.mounted && !(kept && inChild)) return null;
  const Element = tag as ElementType;
  const absent = kept && !present;
  const own = { ...rest, ...(step !== undefined && { 'data-motion-step': step }) };
  if (typeof tag === 'string') return <Element {...own} hidden={absent ? true : (rest as { hidden?: boolean }).hidden} ref={attach} />;
  // A component renders in a wrapper declared with no box: the core moves the wrapper's first element child, the component's
  // root, and the wrapper carries the state. Absent, it is `hidden` with no display of its own, so `hidden` hides it from the
  // server HTML on; it is `display: contents` while it is shown and while its exit plays. The component's own `hidden` is its own.
  const shown = !absent || motion.mounted;
  return (
    <span data-motion-box="child" hidden={absent || undefined} style={shown ? CONTENTS : undefined} ref={attach}>
      <Element {...own} ref={ref} />
    </span>
  );
}

/** The style of the wrapper of a component while it is shown: no box of its own. */
const CONTENTS = { display: 'contents' } as const;
