import { Icon } from '../icon';

type ChipVariant = 'outlined' | 'elevated';

type Props = {
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

  /**
   * Controlled selected state (the resolved value lives in `states.isActive`).
   */
  activated?: boolean;

  onToggle?: (isActive: boolean) => void;

  onRemove?: () => void;

  /**
   * Enable native drag and drop on the chip.
   */
  draggable?: boolean;

  /** Enable label inline edition for this chip (used by Chips variant="input"). */
  editable?: boolean;

  /**
   * Controlled edition state (the resolved value lives in `states.isEditing`).
   */
  editing?: boolean;

  /** Request to start editing (e.g., double-click, Enter/F2). */
  onEditStart?: () => void;

  /** Commit edition with the new label. */
  onEditCommit?: (nextLabel: string) => void;

  /** Cancel edition and restore previous label. */
  onEditCancel?: () => void;

  /**
   * Fired on each edit keystroke when content changes (only while editing).
   * Useful for live formatting, suggestions, validation, etc.
   */
  onChange?: (nextLabel: string) => void;
};

export type ChipStates = {
  /** Resolved selected state (controlled `activated` + internal toggle). */
  isActive: boolean;
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
  props: Props;
  states: ChipStates;
  elements: Elements;
}
