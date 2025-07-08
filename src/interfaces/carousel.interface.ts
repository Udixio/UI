import { Component } from '../utils/component';
import { ReactNode } from 'react';

export type CarouselInterface = Component<{
  type: 'div';
  props: {
    children?: ReactNode;
    marginPourcent?: number;
    onChange?: (index: number) => void;
  };
  states: {};
  defaultProps: {
    variant?:
      | 'hero'
      | 'center-aligned hero'
      | 'multi-browse'
      | 'un-contained'
      | 'full-screen';
    scrollSensitivity?: number;
    gap?: number;
    inputRange?: [number, number];
    outputRange?: [number, number];
  };
  elements: ['carousel', 'track'];
}>;
