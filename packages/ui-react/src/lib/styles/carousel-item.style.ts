import { CarouselItemInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

export const carouselItemConfig: ClassNameComponent<CarouselItemInterface> = () => {
  return {
    carouselItem: classNames('rounded-[28px] overflow-hidden flex-none', {
    }),
  };
};

export const carouselItemStyle = defaultClassNames<CarouselItemInterface>(
  'carouselItem',
  carouselItemConfig,
);

export const useCarouselItemStyle = createUseClassNames<CarouselItemInterface>(
  'carouselItem',
  carouselItemConfig,
);
