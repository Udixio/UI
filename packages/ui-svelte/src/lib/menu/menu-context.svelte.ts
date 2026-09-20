import { getContext, setContext } from 'svelte';
import type { MenuPurpose, MenuVariant } from '@udixio/core';

export interface SvelteMenuContext {
  purpose: () => MenuPurpose;
  variant: () => MenuVariant;
  registerGroup: () => () => void;
}

export const MENU_CONTEXT = Symbol('udixio-menu-context');

export const setMenuContext = (context: SvelteMenuContext) => setContext(MENU_CONTEXT, context);
export const getMenuContext = () => getContext<SvelteMenuContext | undefined>(MENU_CONTEXT);
