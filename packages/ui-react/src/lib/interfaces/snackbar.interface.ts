import { Icon } from '../icon';

export interface SnackbarInterface {
  type: 'div';
  props: {
    duration?: number;
    onClose?: () => void;
    message: string;
    closeIcon?: Icon;
  };
  states: { isVisible: boolean };
  elements: ['snackbar', 'container', 'supportingText', 'action', 'icon'];
}
