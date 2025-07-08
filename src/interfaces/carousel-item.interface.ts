import { ReactNode } from 'react';
import { Component } from '../utils/component';

export type ItemInterface = Component<{
  type: 'div';
  props: { children?: ReactNode | undefined };
  states: {};
  defaultProps: {
    width?: number;
    index?: number;
  };
  elements: ['item'];
}>;
