import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ActionOrLink } from '../utils/component';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';
type Props = {
  variant?: FabVariant;
  label?: string;
  icon: IconDefinition;
  size?: 'small' | 'medium' | 'large';
};
type DefaultProps = {
  isExtended: boolean;
};
export type States = {};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export type FabInterface = ActionOrLink<Props> & {
  defaultProps: DefaultProps;
  elements: Elements;
};
