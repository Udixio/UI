/**
 * Options of the `motion` attachment. They are read through a getter, so a
 * change is followed without re-binding the element.
 */
export interface MotionAttachmentOptions {
  /** Whether the element is shown. A change plays its exit or its entry. Defaults to `true`. */
  present?: boolean;
  /** Changing this value replays an emphasis motion. */
  state?: unknown;
  /** Skips the entry of an element that is already present, such as server-rendered content. */
  settled?: boolean;
  /**
   * The shared identity of the element: a layout motion morphs from the place of another element that held the same key.
   * It is read when the attachment binds, so a later change does not bind the element again.
   *
   * @example
   * ```svelte
   * <img {@attach motion('reflow', () => ({ shared: `pic-${id}` }))} />
   * ```
   */
  shared?: string;
  /**
   * Pauses a loop while true and plays it again when false: a loop pauses by itself out of view, and this holds it for the
   * author too (WCAG 2.2.2), so a `pause: 'control'` loop needs a visible control that sets it. Ignored without a loop.
   *
   * @example
   * ```svelte
   * <span {@attach motion('rotate', () => ({ paused: !loading }))}></span>
   * ```
   */
  paused?: boolean;
}

/**
 * Options of the `motionValue` attachment. They are read through a getter, when a number arrives.
 */
export interface MotionValueAttachmentOptions {
  /**
   * Called with each new number of the value, after it is written. It is not called with the number the value starts from.
   *
   * @example
   * ```svelte
   * <div {@attach motionValue('tilt', () => ({ onChange: (n) => (angle = n) }))}>…</div>
   * ```
   */
  onChange?: (next: number) => void;
}

/**
 * Options of the `motionGesture` attachment. They are read through a getter, when an event arrives.
 */
export interface MotionGestureAttachmentOptions {
  /**
   * Called when a drag is released and has come to rest, with the offset it came to rest at in `detail`.
   */
  onDragEnd?: (event: CustomEvent<{ x: number; y: number }>) => void;
  /**
   * Called with each swipe. Calling `event.preventDefault()` keeps the element in place; removing it from a list needs none.
   */
  onSwipe?: (event: CustomEvent<{ direction: 'start' | 'end' }>) => void;
  /**
   * Called with each reorder step, before the element moves. Calling `event.preventDefault()` keeps the order as it is.
   */
  onReorder?: (event: CustomEvent<{ from: number; to: number }>) => void;
}

/**
 * Options of the `motionSequence` attachment. They are read through a getter, when the sequence binds.
 */
export interface MotionSequenceAttachmentOptions {
  /**
   * Treat the content as already in place: no entry. Default: false, except that a new source on a bound element is settled.
   */
  settled?: boolean;
}
