export interface MenuGroupProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'standard' | 'vibrant';
}

export interface MenuGroupInterface {
  type: 'div';
  props: MenuGroupProps;
  states: {};
  elements: ['menuGroup'];
}
