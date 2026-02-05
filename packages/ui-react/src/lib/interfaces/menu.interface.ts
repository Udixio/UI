export type MenuStates = Record<string, any>;

export interface MenuProps {
  children: React.ReactNode;
  selected?: string | number | (string | number)[];
  onItemSelect?: (value: string | number) => void;
  className?: string;
  variant?: 'standard' | 'vibrant';
  // options prop REMOVED as requested by user ("options passed as children")
  // However, for backward compat or data-driven, one might want it, but I will strictly follow "options as children"
}

export interface MenuInterface {
  type: 'div';
  props: MenuProps;
  states: {
    hasGroups: boolean;
  };
  elements: ['menu'];
}
