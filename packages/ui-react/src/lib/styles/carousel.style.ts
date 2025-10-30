import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
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

export const useCarouselStyle = createUseClassNames<CarouselInterface>(
  'carousel',
  carouselConfig,
);
