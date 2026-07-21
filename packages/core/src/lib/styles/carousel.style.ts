import {
  type ClassNameComponent,
  classNames,
  defaultClassNames,
} from '../utils';
import { CarouselInterface } from '../interfaces';

const carouselConfig: ClassNameComponent<CarouselInterface> = () => ({
  carousel: classNames(['w-full h-[400px]']),
  track: classNames('flex h-full w-full'),
});

export const carouselStyle = defaultClassNames<CarouselInterface>(
  'carousel',
  carouselConfig,
);
