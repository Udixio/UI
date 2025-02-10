import { ReactNode } from 'react';
import { ComponentProps } from '../../../utils';

export type CarouselBaseProps = {
  children?: ReactNode;
  inputRange?: [number, number];
  outputRange?: [number, number];
  variant?:
    | 'hero'
    | 'center-aligned hero'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
  marginPourcent?: number;
  onChange?: (index: number) => void;
  height?: string;
  gap?: number;
};
export type CarouselStates = {};
export type CarouselElements = 'carousel' | 'track';
export type CarouselElementType = 'div';

export type CarouselProps = CarouselBaseProps &
  Omit<
    ComponentProps<
      CarouselBaseProps,
      CarouselStates,
      CarouselElements,
      CarouselElementType
    >,
    'onChange'
  >;
