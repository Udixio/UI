import type { ClassNameComponent, ElementClasses, Icon, TabInterface } from '@udixio/core';
import type {
  HTMLAnchorAttributes,
  HTMLAttributes,
  HTMLButtonAttributes,
} from 'svelte/elements';
import type { Snippet } from 'svelte';

type SharedTabProps = TabInterface['props'];

type CommonForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  keyof SharedTabProps | 'class' | 'children' | 'onclick'
>;

type SvelteTabCommonProps = SharedTabProps &
  CommonForwardedAttributes & {
    /** Classes merged onto the tab root. */
    class?: string;
    /** State-aware classes for the tab and its indicator content. */
    classes?: ElementClasses<TabInterface> | ClassNameComponent<TabInterface>;
    children?: Snippet;
    label?: string;
    icon?: Icon;
    disabled?: boolean;
    /** Native activation handler. */
    onclick?: (
      event: MouseEvent & {
        currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement);
      },
    ) => void;
  };

type ButtonForwardedAttributes = Omit<
  HTMLButtonAttributes,
  keyof SvelteTabCommonProps | 'class' | 'children' | 'form'
>;

type LinkForwardedAttributes = Omit<
  HTMLAnchorAttributes,
  keyof SvelteTabCommonProps | 'class' | 'children' | 'href' | 'target' | 'rel'
>;

type SvelteTabActionProps = SvelteTabCommonProps &
  ButtonForwardedAttributes & {
    href?: undefined;
    target?: undefined;
    rel?: undefined;
    /** Id of an external `<form>` associated with the native button. */
    form?: HTMLButtonAttributes['form'];
  };

type SvelteTabLinkProps = SvelteTabCommonProps &
  LinkForwardedAttributes & {
    /** Navigation destination; switches the native element from button to link. */
    href: string;
    /** Native link browsing-context target. */
    target?: HTMLAnchorAttributes['target'];
    /** Native link relationship tokens. */
    rel?: string;
    /** Button-only attributes are not valid on a navigation link. */
    form?: never;
  };

/**
 * A single tab inside a Tabs tablist.
 * @status beta
 * @parent Tabs
 * @devx Selection is index-based and owned by the parent; there is no standalone selected prop.
 * @a11y Exposes roving tabindex and `aria-controls` when connected to TabPanels.
 * @limitations Horizontal layout only.
 */
export type SvelteTabProps = SvelteTabActionProps | SvelteTabLinkProps;
