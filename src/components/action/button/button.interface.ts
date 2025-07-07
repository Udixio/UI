import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ButtonVariant } from './button.component';
import { Component } from '../../../utils/component';

type Props = {
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

type DefaultProps = {
  variant: 'filled' | 'elevated' | 'outlined' | 'text' | 'filledTonal';
  disabled: boolean;
  iconPosition: 'left' | 'right';
  loading: boolean;
};

type Elements = ['button', 'stateLayer', 'icon', 'label'];

export type ButtonInterface =
  | Component<{
      type: 'a';
      props: Props & { href: string };
      states: {};
      defaultProps: DefaultProps;
      elements: Elements;
    }>
  | Component<{
      type: 'button';
      props: Props & { href?: never };
      states: {};
      defaultProps: DefaultProps;
      elements: Elements;
    }>;
