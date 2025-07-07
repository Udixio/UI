import { classNames, defaultClassNames } from '../utils';
import {
  CarouselBaseProps,
  CarouselElements,
  CarouselStates,
} from '../interfaces/carousel.interface';

export const carouselStyle = defaultClassNames<
  CarouselBaseProps & CarouselStates,
  CarouselElements
>({
  defaultClassName: ({}) => ({
    carousel: classNames(['w-full h-[400px]']),
    track: classNames(
      'grid grid-flow-col h-full transition-transform  ease-out w-fit'
    ),
  }),
  default: 'carousel',
});
