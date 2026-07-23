export type CardVariant = 'outlined' | 'elevated' | 'filled';

export interface CardProps {
  /**
   * Visual container treatment.
   * @default 'outlined'
   */
  variant?: CardVariant;

  /**
   * Enables the actionable treatment: state layer, pointer cursor, and a
   * visible focus outline. Framework adapters also apply it whenever `href`
   * is provided.
   * @default false
   */
  interactive?: boolean;
}

export interface CardInterface {
  type: 'div';
  props: CardProps;
  states: object;
  elements: ['card', 'stateLayer'];
}
