import { CarouselItemInterface } from '../interfaces/carousel-item.interface';
import { classNames, defaultClassNames } from '../utils';

export const carouselItemStyle = defaultClassNames<CarouselItemInterface>(
  'item',
  ({}) => {
    return {
      item: classNames('rounded-[28px] overflow-hidden flex-none'),
    };
  }
);
