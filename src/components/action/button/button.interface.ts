import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ButtonVariant } from './button.component';

import { MergeExclusive } from 'type-fest';
import { ComponentProps } from '../../../utils';

export type ButtonBaseProps = {
  /**
   * The label is the text that is displayed on the button.
   */
  label: string;

  /**
   * The button variant determines the style of the button.
   */
  variant?: ButtonVariant;

  /**
   * Disables the button if set to true.
   */
  disabled?: boolean;

  /**
   * An optional icon to display in the button.
   */
  icon?: IconDefinition;

  iconPosition?: 'left' | 'right';

  loading?: boolean;
};
export type ButtonStates = {};

export type ButtonElements = 'button' | 'stateLayer' | 'icon' | 'label';

export type ButtonProps = MergeExclusive<
  ComponentProps<ButtonBaseProps, ButtonStates, ButtonElements, 'a'> & {
    href: string;
  },
  ComponentProps<ButtonBaseProps, ButtonStates, ButtonElements, 'button'> & {
    href?: never;
  }
> &
  ButtonBaseProps;
