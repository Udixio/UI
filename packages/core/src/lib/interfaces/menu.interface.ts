export type MenuVariant = 'standard' | 'vibrant';

type Props = {
  selected?: string | number | (string | number)[];
  variant?: MenuVariant;
};

export type MenuStates = {
  hasGroups: boolean;
};

export interface MenuInterface {
  type: 'div';
  props: Props;
  states: MenuStates;
  elements: ['menu'];
}
