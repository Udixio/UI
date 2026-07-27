import type { Icon } from '../icon';

// Ce que Chips a besoin de connaître pour (re)construire un Chip
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
  // Pas d'état d'interaction. `object` (et non `Record<string, never>`) car ce
  // dernier rend la signature de style insatisfiable dans l'intersection.
  states: object;
  elements: Elements;
}
