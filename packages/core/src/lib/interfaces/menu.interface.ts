export type MenuVariant = 'standard' | 'vibrant';

export type MenuPurpose = 'actions' | 'selection';
export type MenuInitialFocus = 'none' | 'first' | 'last';

export type MenuProps = {
  /** Visual color treatment shared by the menu family. */
  variant?: MenuVariant;
  /** Selects action-menu or option-list semantics. */
  purpose?: MenuPurpose;
  /** Accessible name used when no external labelled-by relationship exists. */
  accessibleLabel?: string;
  /** Focus target applied when the menu is mounted in a popup. */
  initialFocus?: MenuInitialFocus;
};

export type MenuStates = {
  /** At least one direct or nested MenuGroup is rendered. */
  hasGroups: boolean;
};

export interface MenuInterface {
  type: 'div';
  props: MenuProps;
  states: MenuStates;
  elements: ['menu'];
}
