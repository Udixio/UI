export interface CarouselItemInterface {
  type: 'div';
  props: {
    /** Min/max item width in px, provided by the parent `Carousel`. */
    outputRange?: [number, number];
  };
  states: object;
  elements: ['carouselItem'];
}
