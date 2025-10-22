import { classNames, defaultClassNames } from '../utils';
import { CarouselInterface } from '../interfaces';

export const carouselStyle = defaultClassNames<CarouselInterface>(
  'carousel',
  () => ({
    carousel: classNames(['w-full h-[400px]']),
    track: classNames('flex h-full w-full'),
  }),
);
