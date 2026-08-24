import { Icon } from '../icon';
import type { Transition } from 'motion';

export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'tonal'
  | 'outlined'
  | 'text';
export type ButtonVariantAlias = 'primary' | 'secondary';
export type ButtonIconPosition = 'start' | 'end';
export type ButtonIconPositionAlias = 'left' | 'right';
export type ButtonShapeFeedback = 'morph' | 'none';

export interface ButtonProps {
  /**
   * The HTML button type attribute. Only applies when rendered as `<button>`.
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * An optional icon to display in the button (agnostic Icon data).
   */
  icon?: Icon;

  /**
   * Logical icon position. The `left` and `right` aliases are retained for
   * compatibility and resolve to `start` and `end` respectively.
   * @default 'start'
   */
  iconPosition?: ButtonIconPosition | ButtonIconPositionAlias;

  /** Visual size; every option retains a 48px touch target. */
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';

  /**
   * The button variant determines the style of the button.
   * Aliases: 'primary' maps to 'filled', 'secondary' maps to 'tonal'
   */
  variant?: ButtonVariant | ButtonVariantAlias;

  /**
   * Disables the button if set to true.
   */
  disabled?: boolean;

  /**
   * Aligns text-button content with the surrounding inline edge.
   * Only applies to `text` variant buttons.
   * @default true
   */
  edgeAligned?: boolean;

  /** Blocks interaction and exposes the busy state while preserving the label. */
  loading?: boolean;

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  /**
   * Shape feedback shown for accepted press and toggle interactions.
   * @default 'morph'
   */
  shapeFeedback?: ButtonShapeFeedback;

  /** Motion transition shared by every framework for shape changes. */
  transition?: Transition;

  /** Enables the semantic pressed state and its visual treatment. */
  toggleable?: boolean;

  /**
   * Controlled pressed state. Framework adapters expose the matching change
   * event (`onPressedChange` in React, `pressedChange` in Angular).
   */
  pressed?: boolean;

  /** Initial pressed state when `pressed` is not controlled. */
  defaultPressed?: boolean;

  /** Visible text used when the framework adapter receives no custom content. */
  label?: string;
}

type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export interface ButtonInterface {
  type: 'button';
  props: ButtonProps;
  states: { isPressed: boolean; hasHref: boolean };
  elements: Elements;
}
