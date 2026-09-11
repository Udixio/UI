/**
 * A single item in a carousel, sized by how far the carousel has scrolled.
 */
export interface CarouselItemInterface {
  type: 'div';
  props: {
    /** Min/max item width in px, provided by the parent `Carousel`. */
    outputRange?: [number, number];
  };
  states: object;
  elements: ['carouselItem'];
}
