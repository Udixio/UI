import type { Icon } from '../icon';

export type FabVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'primaryContainer'
  | 'secondaryContainer'
  | 'tertiaryContainer';
export type FabSize = 'small' | 'medium' | 'large';

export interface FabProps {
  /** Accessible name and extended visible text. */
  label: string;
  /** Icon representing the primary action. */
  icon: Icon;
  /** Visual color treatment. @default 'primary' */
  variant?: FabVariant;
  /** Visual size. @default 'medium' */
  size?: FabSize;
  /** Displays the visible text label beside the icon. */
  extended?: boolean;
  /** Disables interaction. */
  disabled?: boolean;
}

export interface FabInterface {
  type: 'button';
  props: FabProps;
  states: object;
  elements: ['fab', 'touchTarget', 'stateLayer', 'icon', 'label'];
}
