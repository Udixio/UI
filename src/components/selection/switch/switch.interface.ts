import { MotionComponentProps } from '@utils/index';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type SwitchBaseProps = {
  selected: boolean;
  activeIcon?: IconDefinition | null;
  inactiveIcon?: IconDefinition | null;
  disabled?: boolean;
  onChange?: ((checked: boolean) => void) | null;
};
export type SwitchStates = {
  isSelected: boolean;
};
export type SwitchElements =
  | 'switch'
  | 'handleContainer'
  | 'icon'
  | 'handleStateLayer'
  | 'handle';

export type SwitchElementType = 'div';

export type SwitchProps = Omit<
  MotionComponentProps<
    SwitchBaseProps,
    SwitchStates,
    SwitchElements,
    SwitchElementType
  >,
  'onChange'
> &
  SwitchBaseProps;
