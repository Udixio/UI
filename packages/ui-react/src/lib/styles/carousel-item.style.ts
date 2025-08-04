import { CarouselItemInterface } from '../interfaces';
import { classNames, defaultClassNames } from '../utils';

export const carouselItemStyle = defaultClassNames<CarouselItemInterface>(
  'carouselItem',
  () => {
    return {
      carouselItem: classNames('rounded-[28px] overflow-hidden flex-none'),
    };
  },
);
