import { ClassNameComponent, StylesHelper } from '../../utils';
import { CarouselElement, CarouselState } from './Carousel';

export const CarouselStyle: ClassNameComponent<
  CarouselState,
  CarouselElement
> = ({}) => {
  return {
    carousel: StylesHelper.classNames([]),
  };
};
