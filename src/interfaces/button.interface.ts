import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ActionOrLink } from '../utils/component';

type Props = {
  /**
   * The label is the text that is displayed on the button.
   */
  label: string;

  /**
   * The button variant determines the style of the button.
   */
  variant?: 'filled' | 'elevated' | 'outlined' | 'text' | 'filledTonal';

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

type Elements = ['button', 'stateLayer', 'icon', 'label'];

export type ButtonInterface = ActionOrLink<Props> & {
  elements: Elements;
};
