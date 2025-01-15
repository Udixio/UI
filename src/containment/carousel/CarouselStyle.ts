import { StylesHelper } from '../../utils';

import { CarouselClassName } from './carousel.interface';

export const carouselStyle: CarouselClassName = ({}) => {
  return {
    carousel: StylesHelper.classNames(['flex']),
  };
};
