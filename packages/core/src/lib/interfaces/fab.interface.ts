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
  /**
   * Visual tooltip text, shown while the fab is compact. Defaults to `label`;
   * set to `false` to hide it. An extended fab never shows one, its label
   * already being visible.
   */
  tooltip?: string | false;
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
