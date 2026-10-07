import type {
  ClassNameComponent,
  ElementClasses,
  MenuItemInterface,
  MenuSubmenuProps,
} from '@udixio/core';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof MenuSubmenuProps | 'class' | 'children'
>;

/**
 * An action menu item that opens a nested actions menu.
 *
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Place it inside an actions Menu and provide MenuItem-family snippets as children.
 * @a11y Arrow Right (Arrow Left in RTL) opens and focuses the first item; the opposite arrow or Escape closes and restores trigger focus. Pointer hover opens the submenu.
 * @limitations Use only in action menus, not in `purpose="selection"` listboxes.
 */
export interface SvelteMenuSubmenuProps
  extends MenuSubmenuProps, ForwardedAttributes {
  /** Classes merged onto the submenu trigger. */
  class?: string;
  /** State-aware classes applied to the trigger using the MenuItem style contract. */
  triggerClasses?:
    ElementClasses<MenuItemInterface> | ClassNameComponent<MenuItemInterface>;
  /** MenuItem-family content for the nested actions menu. */
  children?: Snippet;
}
