import type { ClassNameComponent, ElementClasses, MenuGroupInterface, MenuGroupProps } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof MenuGroupProps | 'class' | 'children'>;

/**
 * Groups related MenuItem children under an optional visible label.
 * @status beta
 * @parent Menu
 * @devx Use `label` for a visible group heading and place related `MenuItem` snippets inside.
 * @a11y The group label is associated with the contained menu items when present.
 * @limitations Groups do not provide nested submenu behavior.
 */
export interface SvelteMenuGroupProps extends MenuGroupProps, ForwardedAttributes {
  /** Classes merged onto the group root. */
  class?: string;
  /** State-aware classes for the group. */
  classes?: ElementClasses<MenuGroupInterface> | ClassNameComponent<MenuGroupInterface>;
  /** Content rendered inside the group. */
  children?: Snippet;
}
