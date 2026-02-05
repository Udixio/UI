export interface MenuGroupProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'standard' | 'vibrant';
  label?: string;
}

export interface MenuGroupInterface {
  type: 'div';
  props: MenuGroupProps;
  states: object;
  elements: ['menuGroup', 'groupLabel'];
}
