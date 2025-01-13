import React from 'react';
import { StyleProps } from '../../utils';

/**
 * Type for the different variants of the Carousel component.
 */
export type CarouselVariant =
  | 'hero'
  | 'center-aligned hero'
  | 'multi-browse'
  | 'un-contained'
  | 'full-screen';

/**
 * Interface for the internal state of the Carousel component.
 */
export interface CarouselInternalState {

}

/**
 * Interface for the default props of the Carousel component.
 */
export interface CarouselDefaultProps {
  /**
   * The variant of the Carousel.
   */
  variant: CarouselVariant;

}

/**
 * Interface for the external props of the Carousel component.
 */
export interface CarouselExternalProps {}

/**
 * Type for the different elements of the Carousel component.
 */
export type CarouselElement = 'carousel';

/**
 * Type for the attributes of the Carousel component.
 * Omits 'className' and 'value' from the standard React InputHTMLAttributes.
 */
export type CarouselAttributes = Omit<
  React.InputHTMLAttributes<HTMLDivElement>,
  'className'
>;
/**
 * Interface for the props of the Carousel component.
 */
export interface CarouselProps
  extends CarouselExternalProps,
    Partial<CarouselDefaultProps>,
    StyleProps<
      CarouselExternalProps & CarouselDefaultProps & CarouselInternalState,
      CarouselElement
    >,
    CarouselAttributes {}
