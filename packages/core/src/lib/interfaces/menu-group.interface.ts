export interface MenuGroupProps {
  variant?: 'standard' | 'vibrant';
  label?: string;
}

export interface MenuGroupInterface {
  type: 'div';
  props: MenuGroupProps;
  states: object;
  elements: ['menuGroup', 'groupLabel'];
}
