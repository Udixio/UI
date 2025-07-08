import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface SnackbarInterface {
  type: 'div';
  props: {
    duration?: number;
    onClose?: () => void;
    supportingText: string;
    closeIcon?: IconDefinition;
  };
  states: { isVisible: boolean };
  elements: ['snackbar', 'container', 'supportingText', 'action', 'icon'];
}
