import { CarouselItemInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

export const carouselItemConfig: ClassNameComponent<CarouselItemInterface> = ({
  width,
}) => {
  return {
    carouselItem: classNames('rounded-[28px] overflow-hidden flex-none', {
      hidden: width === undefined,
      'flex-1': width == null,
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
