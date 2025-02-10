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
    carousel: classNames(['w-full']),
    track: classNames(
      'grid grid-flow-col h-full transition-transform  ease-out w-fit'
    ),
  }),
  default: 'carousel',
});
