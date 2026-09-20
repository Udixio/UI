import type {
  ClassNameComponent,
  ElementClasses,
  MenuInterface,
  MenuProps,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof MenuProps | 'class' | 'children'>;

/**
 * Menus display a list of choices on a temporary surface.
 *
 * @status beta
 * @category Selection
 * @devx Use `purpose="actions"` for commands and `purpose="selection"` for options; set
 * `initialFocus` when mounting inside a popup.
 * @a11y Implements Arrow, Home, End, Escape, and type-ahead focus navigation.
 * @limitations Nested submenus are not included; compose another popup from an item trigger.
 */
export interface SvelteMenuProps extends MenuProps, ForwardedAttributes {
  /** Classes merged onto the menu root. */
  class?: string;
  /** State-aware classes for the menu surface and items. */
  classes?: ElementClasses<MenuInterface> | ClassNameComponent<MenuInterface>;
  /** Content rendered inside the menu surface. */
  children?: Snippet;
}
