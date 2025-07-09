import { CarouselItemInterface } from '../interfaces';
import { classNames, defaultClassNames } from '../utils';

export const carouselItemStyle = defaultClassNames<CarouselItemInterface>(
  'item',
  ({}) => {
    return {
      item: classNames('rounded-[28px] overflow-hidden flex-none'),
    };
  }
);
