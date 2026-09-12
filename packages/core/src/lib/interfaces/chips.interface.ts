import type { Icon } from '../icon';

// What Chips needs to know to (re)build a Chip
export type ChipItem = {
  /** Stable application id. Recommended when items can be reordered. */
  id?: string;
  label: string;
  icon?: Icon;
  selected?: boolean;
  removable?: boolean;
  disabled?: boolean;
  variant?: 'outlined' | 'elevated';
  href?: string;
};

export type ChipsVariant = 'input';

/**
 * Chip sets group related chips into one input, filter, or selection list.
 */
export type ChipsProps = {
  /** Accessible name for the chip collection. */
  label?: string;
  /** Enables inline input and removal behavior. */
  variant?: ChipsVariant;

  /** Uses horizontal overflow instead of wrapping. */
  scrollable?: boolean;

  /** Enables native dragging on every chip. */
  draggable?: boolean;

  /** Controlled source of truth for the collection. */
  items?: ChipItem[];

  /** Notifies list changes caused by selection, editing, or removal. */
  onItemsChange?: (next: ChipItem[]) => void;
};

type Elements = ['chips'];

export interface ChipsInterface {
  type: 'div';
  props: ChipsProps;
  // No interaction state. `object` (and not `Record<string, never>`) because
  // the latter makes the style signature unsatisfiable in the intersection.
  states: object;
  elements: Elements;
}
