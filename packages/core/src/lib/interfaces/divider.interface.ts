export interface DividerProps {
  /**
   * Visual and semantic axis of the dividing line.
   * @default 'horizontal'
   */
  orientation?: 'vertical' | 'horizontal';
}

export interface DividerInterface {
  type: 'hr';
  props: DividerProps;
  elements: ['divider'];
}
