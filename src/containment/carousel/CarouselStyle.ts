import { StylesHelper } from '../../utils';

import { CarouselClassName } from './carousel.interface';

export const carouselStyle: CarouselClassName = ({}) => {
  return {
    carousel: StylesHelper.classNames(['overflow-scroll ']),
    track: StylesHelper.classNames(['flex gap-2']),
  };
};
