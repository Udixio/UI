import {
  ItemBaseProps,
  ItemElements,
  ItemStates,
} from '../interfaces/carousel-item.interface';
import { classNames, defaultClassNames } from '../utils';

export const carouselItemStyle = defaultClassNames<
  ItemBaseProps & ItemStates,
  ItemElements
>({
  defaultClassName: ({}) => {
    return {
      item: classNames('rounded-[28px] overflow-hidden flex-none'),
    };
  },
  default: 'item',
});
