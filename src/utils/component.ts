import { JSX } from 'react/jsx-runtime';
import React from 'react';
import { ComponentClassName, HTMLElements } from './component-helper';

export type ReactProps<T extends Component<any>> = Omit<
  JSX.IntrinsicElements[T['type']],
  'className'
> &
  ComponentClassName<T> & {
    ref?: React.RefObject<HTMLElements[T['type']] | null>;
  } & Partial<T['defaultProps']> &
  T['props'];

export interface Component<
  Config extends {
    type: keyof HTMLElements;
    props: unknown;
    states: unknown;
    defaultProps: unknown;
    elements: string[];
  },
> {
  props: Config['props'];
  states: Config['states'];
  type: Config['type'];
  elements: Config['elements'];
  defaultProps: Config['defaultProps'];
}
