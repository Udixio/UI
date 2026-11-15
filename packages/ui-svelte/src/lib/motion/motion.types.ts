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
}
