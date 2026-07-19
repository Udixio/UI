import { Icon } from '../icon';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

type Props = {
  label?: string;
  icon?: Icon;
  iconSelected?: Icon;
  size?: 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge';
  width?: 'default' | 'narrow' | 'wide';
  onToggle?: (isActive: boolean) => void;
  variant?: IconButtonVariant;
  disabled?: boolean;
  activated?: boolean;
  title?: string | null;

  /**
   * The shape of the button defines whether it is squared or rounded.
   */
  shape?: 'squared' | 'rounded';

  allowShapeTransformation?: boolean;
};

export type IconButtonStates = {
  isActive: boolean;
};
type Elements = ['iconButton', 'stateLayer', 'touchTarget', 'icon'];

export interface IconButtonInterface {
  type: 'button';
  props: Props;
  states: IconButtonStates;
  elements: Elements;
}
