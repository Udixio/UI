import { Icon } from '../icon';
import type { Transition } from 'motion';

export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'tonal'
  | 'outlined'
  | 'text';
export type ButtonVariantAlias = 'primary' | 'secondary';

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

  iconPosition?: 'left' | 'right';

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
   * Controls whether negative margins are applied to text variant buttons.
   * When true, removes the default negative horizontal margins.
   * Only applies to 'text' variant buttons.
   */
  disableTextMargins?: boolean;

  loading?: boolean;

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  allowShapeTransformation?: boolean;

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

  label?: string;
}

type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export interface ButtonInterface {
  type: 'button';
  props: ButtonProps;
  states: { isPressed: boolean };
  elements: Elements;
}
