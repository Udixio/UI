/**
 * A single slide inside a carousel. Its width is driven by the carousel's
 * scroll position; it simply projects its children.
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
