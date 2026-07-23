import { CarouselItemInterface } from '../interfaces';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

export const carouselItemConfig: ClassNameComponent<CarouselItemInterface> = () => {
  return {
    carouselItem: cx('rounded-[28px] overflow-hidden flex-none', {
    }),
  };
};

export const carouselItemStyle = defaultClassNames<CarouselItemInterface>(
  'carouselItem',
  carouselItemConfig,
);
