import { Component } from '../utils/component';

export type DividerInterface = Component<{
  type: 'hr';
  props: {};
  states: {};
  defaultProps: {
    orientation?: 'vertical' | 'horizontal';
  };
  elements: ['divider'];
}>;
