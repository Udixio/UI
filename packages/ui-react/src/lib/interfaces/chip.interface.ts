import { ActionOrLink } from '../utils';
import { Transition } from 'motion';
import { Icon } from '../icon';

type ChipVariant = 'outlined' | 'elevated';

export type ChipProps = {
  /**
   * The label is the text that is displayed on the chip.
   */
  label?: string;

  children?: string;

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

  transition?: Transition;

  onToggle?: (isActive: boolean) => void;

  activated?: boolean;

  selected?: boolean;

  onRemove?: () => void;

  /**
   * Enable native HTML drag and drop on the chip.
   */
  draggable?: boolean;

  /**
   * Called when drag starts (composed with internal handler that sets isDragging).
   */
  onDragStart?: (e: React.DragEvent) => void;

  /**
   * Called when drag ends (composed with internal handler that clears isDragging).
   */
  onDragEnd?: (e: React.DragEvent) => void;
} & (
  | {
      draggable?: false;
    }
  | {
      /** Enable label inline edition for this chip (used by Chips variant="input"). */
      editable?: true;

      /** When true, the chip is currently being edited (driven by parent). */
      isEditing?: boolean;

      /** Request to start editing (e.g., double-click, Enter/F2). */
      onEditStart?: () => void;

      /** Commit edition with the new label. */
      onEditCommit: (nextLabel: string) => void;

      /** Cancel edition and restore previous label. */
      onEditCancel?: () => void;

      /**
       * Fired on each edit keystroke when content changes (only while editing).
       * Useful for live formatting, suggestions, validation, etc.
       */
      onChange?: (nextLabel: string) => void;
    }
);

type Elements = ['chip', 'stateLayer', 'leadingIcon', 'trailingIcon', 'label'];

export type ChipInterface = ActionOrLink<ChipProps> & {
  elements: Elements;
  states: {
    isActive: boolean;
    trailingIcon?: boolean;
    isSelected: boolean;
    isInteractive: boolean;
    isDragging?: boolean;
    isEditing?: boolean;
  };
};
