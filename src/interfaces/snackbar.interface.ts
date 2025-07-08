import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Component } from '../utils/component';

export type SnackbarInterface = Component<{
  type: 'div';
  props: {
    duration?: number;
    onClose?: () => void;
    supportingText: string;
  };
  states: { isVisible: boolean };
  defaultProps: { closeIcon: IconDefinition };
  elements: ['snackbar', 'container', 'supportingText', 'action', 'icon'];
}>;
