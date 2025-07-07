import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { MotionComponentProps } from '../utils';

export type SnackbarBaseProps = {
  closeIcon?: IconDefinition;
  duration?: number;
  onClose?: () => void;
  supportingText: string;
};
export type SnackbarStates = {
  isVisible: boolean;
};
export type SnackbarElements =
  | 'snackbar'
  | 'container'
  | 'supportingText'
  | 'action'
  | 'icon';
export type SnackbarElementType = 'div';

export type SnackbarProps = SnackbarBaseProps &
  MotionComponentProps<
    SnackbarBaseProps,
    SnackbarStates,
    SnackbarElements,
    SnackbarElementType
  >;
