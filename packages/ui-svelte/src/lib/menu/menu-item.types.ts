import type {
  ClassNameComponent,
  ElementClasses,
  MenuItemInterface,
  MenuItemProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLElement>, keyof MenuItemProps | 'class' | 'children' | 'onclick'>;

/**
 * An action or selectable choice within a Menu.
 *
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Use `selectionType`, `selected`, and `onSelectedChange` for selectable items.
 * @a11y Resolves to menuitem, menuitemradio, menuitemcheckbox, or option from the parent Menu.
 * @limitations Nested submenus require a separate popup composition.
 */
export interface SvelteMenuItemProps extends MenuItemProps, ForwardedAttributes {
  /** Classes merged onto the item root. */
  class?: string;
  /** State-aware classes for the item and its state layer. */
  classes?: ElementClasses<MenuItemInterface> | ClassNameComponent<MenuItemInterface>;
  /** String or snippet content used instead of `label`. */
  children?: Snippet;
  href?: string;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Native activation handler. */
  onclick?: (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => void;
}
