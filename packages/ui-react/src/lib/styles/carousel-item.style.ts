import { CarouselItemInterface } from '../interfaces';
import { classNames, defaultClassNames } from '../utils';

export const carouselItemStyle = defaultClassNames<CarouselItemInterface>(
  'carouselItem',
  ({ width }) => {
    return {
      carouselItem: classNames('rounded-[28px] overflow-hidden flex-none', {
        hidden: width === undefined,
        'flex-1': width == null,
      }),
    };
  },
);
