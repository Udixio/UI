import { ClassNameComponent, StylesHelper } from '../../utils';

import {
  CarouselElement,
  CarouselInternalState,
  CarouselProps,
} from './carousel.interface';

export const CarouselStyle: ClassNameComponent<
  CarouselProps & CarouselInternalState,
  CarouselElement
> = ({}) => {
  return {
    carousel: StylesHelper.classNames([]),
  };
};
