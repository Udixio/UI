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
  icon: Icon;
  size?: 'small' | 'medium' | 'large';
  extended?: boolean;
};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export interface FabInterface {
  type: 'button';
  props: Props;
  states: object;
  elements: Elements;
}
