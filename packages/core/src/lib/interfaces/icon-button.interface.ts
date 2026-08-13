import type { Transition } from 'motion';
import type { Icon } from '../icon';
import type { ButtonShapeFeedback } from './button.interface';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';
export type IconButtonSize = 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
export type IconButtonWidth = 'default' | 'narrow' | 'wide';

export interface IconButtonProps {
  /** Accessible name announced for the icon-only control. */
  label: string;
  /** Icon shown in the resting state. */
  icon: Icon;
  /** Visual tooltip text. Defaults to `label`; set to `false` to hide it. */
  tooltip?: string | false;
  /** Optional icon shown while a toggle icon button is pressed. */
  pressedIcon?: Icon;
  /** Visual style. @default 'standard' */
  variant?: IconButtonVariant;
  /** Visual size; every option retains at least a 48px touch target. */
  size?: IconButtonSize;
  /** Horizontal container width. @default 'default' */
  width?: IconButtonWidth;
  /** Disables interaction. */
  disabled?: boolean;
  /** Resting container shape. @default 'rounded' */
  shape?: 'squared' | 'rounded';
  /** Shape feedback shown for accepted press and toggle interactions. */
  shapeFeedback?: ButtonShapeFeedback;
  /** Motion transition shared by every framework for shape changes. */
  transition?: Transition;
  /** Enables semantic pressed state for action buttons. */
  toggleable?: boolean;
  /** Controlled pressed state. */
  pressed?: boolean;
  /** Initial pressed state when `pressed` is not controlled. */
  defaultPressed?: boolean;
}

export interface IconButtonInterface {
  type: 'button';
  props: IconButtonProps;
  states: { isPressed: boolean };
  elements: ['iconButton', 'stateLayer', 'touchTarget', 'icon'];
}
