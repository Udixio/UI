import React, { forwardRef, useRef } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { CarouselStyle } from './CarouselStyle';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';

export interface CarouselState {}

export type CarouselElement =
  | 'carousel'


export interface CarouselProps
  extends StyleProps<CarouselState, CarouselElement>,
    CarouselState,
    Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'className'
    > {
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>((args, ref) => {
  const { className, ...restProps }: CarouselProps = args;
  const getClassNames = (() => {
    return StylesHelper.classNamesElements<CarouselState, CarouselElement>({
      default: 'carousel',
      classNameList: [className, CarouselStyle],
      states: {},
    });
  })();

  const defaultRef = useRef<HTMLDivElement>(null);
  const resolvedRef: React.RefObject<any> | React.ForwardedRef<any> =
    ref || defaultRef;


  return (
    <div
      className={getClassNames.carousel}
      ref={resolvedRef}
      {...restProps}
    >

    </div>
  );
});
