import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ButtonVariant } from './button';
import { ComponentProps } from '@utils/index';
import { useRef } from 'react';

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
  icon?: IconDefinition | null;

  iconPosition?: 'left' | 'right';

  loading?: boolean;
};
export type ButtonStates = {};

export type ButtonElements = 'button' | 'stateLayer' | 'icon' | 'label';

export type ButtonProps = (
  | (ComponentProps<ButtonBaseProps, ButtonStates, ButtonElements, 'a'> & {
      // type?: never;
      href: string;
    })
  | (ComponentProps<ButtonBaseProps, ButtonStates, ButtonElements, 'button'> & {
      href?: never;
    })
) &
  ButtonBaseProps;
