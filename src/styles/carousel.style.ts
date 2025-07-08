import { classNames, defaultClassNames } from '../utils';
import { CarouselInterface } from '../interfaces/carousel.interface';

export const carouselStyle = defaultClassNames<CarouselInterface>(
  'carousel',
  ({}) => ({
    carousel: classNames(['w-full h-[400px]']),
    track: classNames(
      'grid grid-flow-col h-full transition-transform  ease-out w-fit'
    ),
  })
);
