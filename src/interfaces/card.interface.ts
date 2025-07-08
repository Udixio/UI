export interface CardInterface {
  type: 'div';
  props: {
    variant?: 'outlined' | 'elevated' | 'filled';
    isInteractive?: boolean;
  };
  elements: ['card', 'stateLayer'];
}
