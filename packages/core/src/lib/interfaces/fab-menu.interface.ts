import type { Icon } from '../icon';
import type { FabSize } from './fab.interface';

export type FabMenuVariant = 'primary' | 'secondary' | 'tertiary';

export interface FabMenuAction {
  /** Stable identity used by framework renderers. */
  id: string;
  /** Visible and accessible action label. */
  label: string;
  /** Optional leading icon. */
  icon?: Icon;
  /** Optional navigation destination. */
  href?: string;
  /** Prevents action or navigation. */
  disabled?: boolean;
}

export interface FabMenuProps {
  /** Accessible name of the primary trigger. */
  label: string;
  /** Icon shown while the menu is closed. */
  icon: Icon;
  /** Framework-independent action model. */
  actions: readonly FabMenuAction[];
  /** Optional icon shown while the menu is open. */
  closeIcon?: Icon;
  /** Accessible name of the open/close trigger while open. */
  closeLabel?: string;
  /** Accessible name applied to the action group. */
  actionsLabel?: string;
  /** Trigger and action color family. @default 'primary' */
  variant?: FabMenuVariant;
  /** Trigger size. @default 'medium' */
  size?: FabSize;
  /** Shows the trigger text beside its icon. */
  extended?: boolean;
  /** Disables the trigger and every action. */
  disabled?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
}

export interface FabMenuInterface {
  type: 'div';
  props: FabMenuProps;
  states: { isOpen: boolean };
  elements: ['fabMenu', 'fab', 'actions', 'action'];
}
