/**
 * Hides an element from sight, and keeps it for assistive technology, without taking any width: a counter's final
 * number, and the live region of a gesture's announcements.
 */
export const VISUALLY_HIDDEN =
  'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0';
