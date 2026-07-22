import type { Transition } from 'motion';

export interface StateLayerShapeTransition {
  restingBorderRadius: string;
  pressedBorderRadius: string;
  enabled: boolean;
  transition: Transition;
}

export interface StateLayerProps {
  /** Semantic color token name, without the `--color-` prefix. */
  colorName: string;

  /** Tailwind state utility selecting the interaction trigger. */
  stateClassName?: string;

  /** Optional Motion animation applied to the state layer trigger. */
  shapeTransition?: StateLayerShapeTransition;
}

export interface StateLayerInterface {
  type: 'div';
  props: StateLayerProps;
  states: object;
  elements: ['stateLayer'];
}
