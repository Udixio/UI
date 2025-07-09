import { ReactNode } from 'react';

export interface CarouselInterface {
  type: 'div';
  props: {
    children?: ReactNode;
    marginPourcent?: number;
    onChange?: (index: number) => void;
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
}
