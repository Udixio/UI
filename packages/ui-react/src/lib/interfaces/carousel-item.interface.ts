import { ReactNode } from 'react';

export interface CarouselItemInterface {
  type: 'div';
  props: {
    children?: ReactNode | undefined;
    width?: number | null;
    index?: number;
  };
  elements: ['carouselItem'];
}
