import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { MotionComponentProps } from '@utils/component-helper';

export type SnackbarBaseProps = {
  closeIcon?: IconDefinition;
  duration?: number | null;
  onClose?: (() => void) | null;
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
