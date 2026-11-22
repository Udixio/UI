import type { BindOptions, GestureOptions } from '@udixio/motion';

/**
 * Options of the `motion` attachment. They are read through a getter, so a
 * change is followed without re-binding the element.
 */
export interface MotionAttachmentOptions {
  /**
   * Whether the element is shown. The element stays in the DOM: `false` plays its exit, the element staying displayed until
   * the exit has finished, then `hidden` hides it; `true` removes `hidden` and plays its entry, as for an HTML element with
   * `hidden` and `data-motion`. An element absent when the attachment binds is `hidden` at once, with no exit. The server
   * runs no attachment: write `hidden={!open}` on the element too, so that the server HTML is hidden while its content
   * stays indexable. While it stays `true`, the element's own `hidden` is left to the author. Defaults to `true`.
   *
   * @example
   * ```svelte
   * <ul hidden={!open} {@attach motion('fade', () => ({ present: open }))}>…</ul>
   * ```
   */
  present?: boolean;
  /**
   * Each change of this value calls `play()` without a kind: the first listed motion that is not a presence plays. An
   * emphasis replays, a reveal replays from its first frame, a layout compares and moves once the new style is applied, a
   * loop resumes.
   *
   * @example
   * ```svelte
   * <div style:width="{wide ? 480 : 240}px" {@attach motion('reflow', () => ({ state: wide }))}>…</div>
   * ```
   */
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
  /**
   * Where focus goes when an exit starts with focus inside the element (WCAG 2.4.3): an element, or a function that gives one when
   * the exit starts. It is read when the attachment binds, as `shared` is, so a function names an element rendered later.
   *
   * @example
   * ```svelte
   * <div {@attach motion('fade', () => ({ restoreFocus: () => opener }))}>…</div>
   * ```
   */
  restoreFocus?: BindOptions['restoreFocus'];
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
  /**
   * Where focus goes when a swipe flies out with focus inside the element (WCAG 2.4.3): an element, or a function that gives
   * one then; `false` leaves focus where it is. Without one, focus moves to the next sibling with the same gesture, else the
   * previous one, else the parent. Read when the swipe flies out.
   */
  restoreFocus?: GestureOptions['restoreFocus'];
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
