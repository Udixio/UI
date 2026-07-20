export interface CardInterface {
  type: 'div';
  props: {
    variant?: 'outlined' | 'elevated' | 'filled';
    interactive?: boolean;
  };
  states: object;
  elements: ['card', 'stateLayer'];
}
