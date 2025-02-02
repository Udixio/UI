import { classNames, defaultClassNames } from '../../../utils';
import {
  CarouselBaseProps,
  CarouselElements,
  CarouselStates,
} from './carousel.interface';

export const carouselStyle = defaultClassNames<
  CarouselBaseProps & CarouselStates,
  CarouselElements
>({
  defaultClassName: ({}) => ({
    carousel: classNames(['overflow-x-scroll ']),
    track: classNames(['flex gap-2 h-full']),
  }),
  default: 'carousel',
});
