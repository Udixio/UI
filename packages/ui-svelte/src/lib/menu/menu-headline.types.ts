import type { ClassNameComponent, ElementClasses, MenuHeadlineInterface, MenuHeadlineProps } from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';

type ForwardedAttributes = Omit<HTMLAttributes<HTMLDivElement>, keyof MenuHeadlineProps | 'class' | 'children'>;

/**
 * A non-interactive visual heading inside a Menu.
 * @status beta
 * @parent Menu
 * @devx Place the headline before the commands or choices it labels.
 * @a11y The headline is presentational and does not enter the menu focus order.
 * @limitations It cannot receive selection or activation events.
 */
export interface SvelteMenuHeadlineProps extends MenuHeadlineProps, ForwardedAttributes {
  /** Classes merged onto the headline root. */
  class?: string;
  /** State-aware classes for the headline. */
  classes?: ElementClasses<MenuHeadlineInterface> | ClassNameComponent<MenuHeadlineInterface>;
}
