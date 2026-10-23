import type {
  ClassNameComponent,
  ElementClasses,
  MenuItemInterface,
  MenuItemProps,
} from '@udixio/core';
import type {
  HTMLAnchorAttributes,
  HTMLAttributes,
  HTMLButtonAttributes,
} from 'svelte/elements';
import type { Snippet } from 'svelte';

type CommonForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  | keyof MenuItemProps
  | 'class'
  | 'children'
  | 'onclick'
  | 'role'
  | 'aria-checked'
  | 'aria-disabled'
  | 'aria-selected'
>;

type SvelteMenuItemCommonProps = MenuItemProps &
  CommonForwardedAttributes & {
    /** Classes merged onto the item root. */
    class?: string;
    /** State-aware classes for the item and its state layer. */
    classes?:
      | ElementClasses<MenuItemInterface>
      | ClassNameComponent<MenuItemInterface>;
    /** String or snippet content used instead of `label`. */
    children?: Snippet;
    /** Native activation handler. */
    onclick?: (
      event: MouseEvent & {
        currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement);
      },
    ) => void;
  };

type ButtonForwardedAttributes = Omit<
  HTMLButtonAttributes,
  | keyof SvelteMenuItemCommonProps
  | 'class'
  | 'children'
  | 'role'
  | 'aria-checked'
  | 'aria-disabled'
  | 'aria-selected'
  | 'value'
  | 'form'
>;

type LinkForwardedAttributes = Omit<
  HTMLAnchorAttributes,
  | keyof SvelteMenuItemCommonProps
  | 'class'
  | 'children'
  | 'href'
  | 'role'
  | 'aria-checked'
  | 'aria-disabled'
  | 'aria-selected'
  | 'value'
  | 'form'
>;

type SvelteMenuItemActionProps = SvelteMenuItemCommonProps &
  ButtonForwardedAttributes & {
    href?: undefined;
    /** Id of an external `<form>` associated with the native button. */
    form?: HTMLButtonAttributes['form'];
  };

type SvelteMenuItemLinkProps = SvelteMenuItemCommonProps &
  LinkForwardedAttributes & {
    /** Navigation destination; switches the native element from button to link. */
    href: string;
    /** Button-only attributes are not valid on a navigation link. */
    form?: never;
  };

/**
 * An action or selectable choice within a Menu.
 *
 * @status beta
 * @category Selection
 * @parent menu
 * @devx Use `selectionType`, `selected`, and `onSelectedChange` for selectable items. Use `MenuSubmenu` when the row should open another actions menu.
 * @a11y Resolves to menuitem, menuitemradio, menuitemcheckbox, or option from the parent Menu.
 * @limitations Positioning, dismissal, and nested-menu lifecycle are owned by the surrounding menu surface; use `MenuSubmenu` for nested menus.
 */
export type SvelteMenuItemProps =
  | SvelteMenuItemActionProps
  | SvelteMenuItemLinkProps;
