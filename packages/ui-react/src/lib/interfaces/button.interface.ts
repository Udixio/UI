import { ActionOrLink } from '../utils';
import { Transition } from 'motion';
import { Icon } from '../icon';

type Props = {
  /**
   * The label is the text that is displayed on the button.
   */
  label?: string;

  children?: string;

  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';

  /**
   * The button variant determines the style of the button.
   */
  variant?: 'filled' | 'elevated' | 'tonal' | 'outlined' | 'text';

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

  /**
   * An optional icon to display in the button.
   */
  icon?: Icon;

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
