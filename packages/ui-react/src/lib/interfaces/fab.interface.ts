import { ActionOrLink } from '../utils/component';
import { Transition } from 'motion';
import { Icon } from '../icon';

export type FabVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'primaryContainer'
  | 'secondaryContainer'
  | 'tertiaryContainer';
type Props = {
  variant?: FabVariant;
  label?: string;
  children?: string;
  icon: Icon;
  size?: 'small' | 'medium' | 'large';
  extended?: boolean;
  transition?: Transition;
};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export type FabInterface = ActionOrLink<Props> & {
  elements: Elements;
};
