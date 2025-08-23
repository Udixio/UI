import { ActionOrLink } from '../utils/component';
import { Transition } from 'motion';
import { Icon } from '../icon';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';
type Props = {
  variant?: FabVariant;
  label?: string;
  children?: string;
  icon: Icon;
  size?: 'small' | 'medium' | 'large';
  isExtended?: boolean;
  transition?: Transition;
};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export type FabInterface = ActionOrLink<Props> & {
  elements: Elements;
};
