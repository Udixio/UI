import { Icon } from '../icon';

export type ChipVariant = 'outlined' | 'elevated';

export type ChipProps = {
  /**
   * The label is the text that is displayed on the chip.
   */
  label?: string;

  /**
   * The chip variant determines the style.
   */
  variant?: ChipVariant;

  /**
   * Disables the chip if set to true.
   */
  disabled?: boolean;

  /**
   * An optional icon to display in the chip.
   */
  icon?: Icon;

  /** Controlled selected state. */
  selected?: boolean;

  /** Initial selected state when the chip is uncontrolled. */
  defaultSelected?: boolean;

  /** Notifies selection requests in controlled and uncontrolled modes. */
  onSelectedChange?: (selected: boolean) => void;

  /** Requests removal of this chip. */
  onRemove?: () => void;

  /** Optional navigation target. */
  href?: string;

  /**
   * Enable native drag and drop on the chip.
   */
  draggable?: boolean;

  /** Enables inline label editing, used by `Chips` in input mode. */
  editable?: boolean;

  /**
   * Controlled edition state (the resolved value lives in `states.isEditing`).
   */
  editing?: boolean;

  /** Requests editing, for example after a double-click, Enter, or F2. */
  onEditStart?: () => void;

  /** Commits editing with the normalized label. */
  onEditCommit?: (nextLabel: string) => void;

  /** Cancels editing and restores the previous label. */
  onEditCancel?: () => void;

  /**
   * Fires whenever the editable label changes.
   */
  onChange?: (nextLabel: string) => void;
};

export type ChipStates = {
  /** Resolved selected state. */
  isSelected: boolean;
  /** The chip currently holds the focus. */
  isFocused: boolean;
  /** The chip reacts to user interaction (toggle, remove, click, link, edit). */
  isInteractive: boolean;
  /** A native drag is in progress. */
  isDragging: boolean;
  /** Resolved edition state (controlled `editing` + internal edition). */
  isEditing: boolean;
  /** A trailing (remove) icon is rendered. */
  trailingIcon: boolean;
};

type Elements = ['chip', 'stateLayer', 'leadingIcon', 'trailingIcon', 'label'];

export interface ChipInterface {
  type: 'button';
  props: ChipProps;
  states: ChipStates;
  elements: Elements;
}
