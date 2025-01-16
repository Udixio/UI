import { StylesHelper } from '../../utils';

import { CarouselClassName } from './carousel.interface';

export const carouselStyle: CarouselClassName = ({}) => {
  return {
    carousel: StylesHelper.classNames(['overflow-scroll h-[400px]']),
    track: StylesHelper.classNames(['flex gap-2 h-full']),
  };
};
