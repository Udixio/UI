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
}
