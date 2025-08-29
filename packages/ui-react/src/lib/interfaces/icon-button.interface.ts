import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IconButtonVariant } from '../components/IconButton';
import { ActionOrLink } from '../utils/component';
import { Transition } from 'motion';
import { Icon } from '../icon';

type Props = {
  label?: string;
  children?: string;
  icon: Icon;
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
  width?: 'default' | 'narrow' | 'wide';
  iconSelected?: IconDefinition;
  onToggle?: (isActive: boolean) => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  activated?: boolean;

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  allowShapeTransformation?: boolean;

  transition?: Transition;
};

export type IconButtonStates = {
  isActive: boolean;
};
type Elements = ['iconButton', 'stateLayer', 'touchTarget', 'icon'];

export type IconButtonInterface = ActionOrLink<Props> & {
  states: IconButtonStates;
  elements: Elements;
};
