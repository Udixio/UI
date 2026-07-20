export interface CarouselItemInterface {
  type: 'div';
  props: {
    width?: number;
    index?: number;
    outputRange?: [number, number];
  };
  states: object;
  elements: ['carouselItem'];
}
