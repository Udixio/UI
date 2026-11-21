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
 * The nested menu stays in the DOM while closed, hidden; pass `lazy` to mount it only while open.
 * Opening, the nested menu grows from the side of its trigger (scale 0.8 to 1 on the fast spatial spring, fade on the fast effects spring); it leaves faster, on the fast effects spring.
 * @a11y Arrow Right (Arrow Left in RTL) opens and focuses the first item; the opposite arrow or Escape closes and restores trigger focus. Pointer hover opens the submenu. A closing submenu is inert at once and hidden once its exit has played; under reduced motion it opens and closes at once.
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
