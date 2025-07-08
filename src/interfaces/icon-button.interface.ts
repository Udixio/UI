import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IconButtonVariant } from '../components/IconButton';
import { ActionOrLink } from '../utils/component';

type Props = {
  arialLabel: string;
  icon: IconDefinition;
  iconSelected?: IconDefinition;
  onToggle?: (isActive: boolean) => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  activated?: boolean;
};

export type IconButtonStates = {
  isActive: boolean;
};
type Elements = ['button', 'stateLayer', 'icon'];

export type IconButtonInterface = ActionOrLink<Props> & {
  states: IconButtonStates;
  elements: Elements;
};
