import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ActionOrLink } from '../utils';
import { Transition } from 'motion';

type Props = {
  /**
   * The label is the text that is displayed on the button.
   */
  label: string;

  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';

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

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  allowShapeTransformation?: boolean;

  transition?: Transition;

  onToggle?: (isActive: boolean) => void;
  activated?: boolean;
};

type Elements = ['button', 'touchTarget', 'stateLayer', 'icon', 'label'];

export type ButtonInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {
    isActive: boolean;
  };
};
