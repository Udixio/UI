/**
 * Badges show notifications, counts, or status information on navigation
 * items and icons.
 */
export interface BadgeProps {
  /**
   * Text shown inside the badge. Omitted, the badge renders as the small dot
   * Material 3 uses for an unread notification.
   *
   * Material limits badge content to four characters including a `+`; use
   * `max` to keep a count within that.
   */
  label?: string | number;

  /**
   * Caps a numeric `label`. A label of 100 with `max` 99 renders `99+`.
   * Ignored when `label` is not a number.
   */
  max?: number;

  /**
   * What assistive technology announces for the badge, such as
   * `3 unread messages`.
   *
   * The visible label is rarely enough on its own -- `3` says nothing about
   * what there are three of -- and the small dot has no text at all, so this
   * is the only way it reaches a screen reader.
   */
  description?: string;
}

export interface BadgeStates {
  /**
   * Resolved from `label`: Material's two variants differ only by whether
   * the badge carries text, so the variant is derived rather than declared
   * and `small` with a label cannot be expressed.
   */
  variant: 'small' | 'large';
}

export interface BadgeInterface {
  type: 'span';
  props: BadgeProps;
  states: BadgeStates;
  elements: ['container', 'badge', 'label'];
}
