import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ActionOrLink } from '../utils/component';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';
type Props = {
  variant?: FabVariant;
  label?: string;
  icon: IconDefinition;
  size?: 'small' | 'medium' | 'large';
  isExtended?: boolean;
};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export type FabInterface = ActionOrLink<Props> & {
  elements: Elements;
};
