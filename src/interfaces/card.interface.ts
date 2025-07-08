export interface CardInterface {
  type: 'div';
  defaultProps: {
    variant?: 'outlined' | 'elevated' | 'filled';
    isInteractive?: boolean;
  };
  elements: ['card', 'stateLayer'];
}
