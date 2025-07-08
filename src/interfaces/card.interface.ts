import { Component } from '../utils/component';

export type CardInterface = Component<{
  type: 'div';
  props: {};
  states: {};
  defaultProps: {
    variant?: 'outlined' | 'elevated' | 'filled';
    isInteractive?: boolean;
  };
  elements: ['card', 'stateLayer'];
}>;
