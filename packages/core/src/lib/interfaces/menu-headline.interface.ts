export interface MenuHeadlineInterface {
  type: 'div';
  props: {
    label?: string;
    variant?: 'standard' | 'vibrant';
  };
  states: object;
  elements: ['headline'];
}
