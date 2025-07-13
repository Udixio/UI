export interface DividerInterface {
  type: 'hr';
  props: {
    orientation?: 'vertical' | 'horizontal';
  };
  elements: ['divider'];
}
