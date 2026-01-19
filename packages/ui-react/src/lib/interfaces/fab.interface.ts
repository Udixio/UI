import { ActionOrLink } from '../utils/component';
import { Transition } from 'motion';
import { Icon } from '../icon';
import { ReactNode } from 'react';

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
  children?: ReactNode;
  icon: Icon;
  size?: 'small' | 'medium' | 'large';
  extended?: boolean;
  transition?: Transition;
};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export type FabInterface = ActionOrLink<Props> & {
  elements: Elements;
};
