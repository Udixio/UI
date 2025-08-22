import { ReactElement } from 'react';
import { CarouselItem } from '../components';

export interface CarouselInterface {
  type: 'div';
  props: {
    children?: ReactElement<typeof CarouselItem>[];
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
