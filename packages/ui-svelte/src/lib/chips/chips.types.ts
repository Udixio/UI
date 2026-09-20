import type {
  ChipItem,
  ChipsInterface,
  ChipsProps,
  ClassNameComponent,
  ElementClasses,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof ChipsProps | 'class' | 'children'>;

/**
 * A labelled collection of selectable or editable chips.
 *
 * @status beta
 * @category Input
 * @devx Pass stable `ChipItem.id` values and update `items` from `onItemsChange`.
 * @a11y Renders a labelled list; each chip keeps native button or link semantics.
 * @limitations Large collections are not virtualized.
 */
export interface SvelteChipsProps extends ChipsProps, ForwardedAttributes {
  /** Classes merged onto the collection root. */
  class?: string;
  /** State-aware classes for the collection root. */
  classes?: ElementClasses<ChipsInterface> | ClassNameComponent<ChipsInterface>;
  items?: ChipItem[];
  onItemsChange?: (items: ChipItem[]) => void;
}
