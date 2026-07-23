import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { CarouselInterface } from '../interfaces';

const carouselConfig: ClassNameComponent<CarouselInterface> = () => ({
  carousel: cx(['w-full h-[400px]']),
  track: cx('flex h-full w-full'),
});

export const carouselStyle = defaultClassNames<CarouselInterface>(
  'carousel',
  carouselConfig,
);
