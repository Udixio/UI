import type { Transition } from 'motion';

export interface StateLayerShapeTransition {
  restingBorderRadius: string;
  pressedBorderRadius: string;
  enabled: boolean;
  transition: Transition;
}

export interface StateLayerProps {
  /**
   * Semantic color token name, without the `--color-` prefix -- `on-primary`,
   * `on-surface-variant`, and so on.
   *
   * An unknown name falls back to `on-surface` rather than resolving to
   * nothing: the Tailwind hover and focus utilities read `--state-color`
   * without a fallback of their own, so an unresolvable token used to remove
   * the hover state entirely while leaving the ripple visible.
   *
   * This is typed as `string` because the set of valid tokens lives in
   * `@udixio/theme`, which `@udixio/core` does not depend on.
   */
  colorName: string;

  /** Tailwind state utility selecting the interaction trigger. */
  stateClassName?: string;

  /** Optional Motion animation applied to the state layer trigger. */
  shapeTransition?: StateLayerShapeTransition;
}

export interface StateLayerInterface {
  type: 'span';
  props: StateLayerProps;
  states: object;
  elements: ['stateLayer'];
}
