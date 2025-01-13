import React, { useRef } from 'react';
import { StylesHelper } from '../../utils';
import { CarouselStyle } from './CarouselStyle';
import {
  CarouselDefaultProps, CarouselElement,
  CarouselExternalProps,
  CarouselInternalState,
  CarouselProps,
} from './carousel.interface';

export const Carousel = ({
  className,
  variant = 'hero',
  ref,
  ...restProps
}: CarouselProps) => {
  const getClassNames = (() => {
    return StylesHelper.classNamesElements<
      CarouselExternalProps & CarouselDefaultProps & CarouselInternalState,
      CarouselElement
    >({
      default: 'carousel',
      classNameList: [className, CarouselStyle],
      states: {
        variant,
        ref
      },
    });
  })();

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;

  return (
    <div className={getClassNames.carousel} ref={resolvedRef} {...restProps}>
      caroussel
    </div>
  );
};
