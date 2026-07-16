import { JSX } from 'react/jsx-runtime';
import React from 'react';
import { ComponentClassName, HTMLElements } from './component-helper';
import { HTMLMotionProps } from 'motion/react';

export type ReactProps<T extends ComponentInterface> = Omit<
  JSX.IntrinsicElements[T['type']],
  keyof T['props'] | 'className' | 'children'
> &
  ComponentClassName<T> & {
    ref?: React.RefObject<HTMLElements[T['type']] | null>;
  } & T['props'];

export type MotionProps<T extends ComponentInterface> = ReactProps<T> &
  HTMLMotionProps<T['type']>;

export interface LinkInterface<Props> {
  type: 'a';
  props: Props & { href?: string };
}

export interface ActionInterface<Props> {
  type: 'button';
  props: Props & { href?: never };
}

export type ActionOrLink<Props> = LinkInterface<Props> | ActionInterface<Props>;

export interface ComponentInterface {
  type: keyof HTMLElements;
  props?: object;
  states?: object;
  elements: string[];
}
