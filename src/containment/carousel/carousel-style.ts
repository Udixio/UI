import {
  CarouselBaseProps,
  CarouselElements,
  CarouselStates,
} from './carousel.interface';
import { classNames } from '../../utils/styles/classnames';
import { defaultClassNames } from '../../utils/styles/get-classname';

export const carouselStyle = defaultClassNames<
  CarouselBaseProps & CarouselStates,
  CarouselElements
>({
  defaultClassName: ({}) => {
    return {
      carousel: classNames(['overflow-x-scroll ']),
      track: classNames(['flex gap-2 h-full']),
    };
  },
  default: 'carousel',
});
