import { ActionOrLink } from '../utils';
import { Transition } from 'motion';
import { Icon } from '../icon';

type ChipVariant = 'outlined' | 'elevated';

type Props = {
  /**
   * The label is the text that is displayed on the chip.
   */
  label?: string;

  children?: string;

  /**
   * The chip variant determines the style.
   */
  variant?: ChipVariant;

  /**
   * Disables the chip if set to true.
   */
  disabled?: boolean;

  /**
   * An optional icon to display in the chip.
   */
  icon?: Icon;

  loading?: boolean;

  transition?: Transition;

  onToggle?: (isActive: boolean) => void;
  activated?: boolean;
};

type Elements = ['chip', 'touchTarget', 'stateLayer', 'icon', 'label'];

export type ChipInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {
    isActive: boolean;
  };
};
