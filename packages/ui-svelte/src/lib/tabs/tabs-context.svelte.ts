import { getContext, setContext } from 'svelte';
import type { Icon, TabsVariant } from '@udixio/core';

export interface TabRegistration {
  element?: HTMLElement;
  content?: HTMLElement;
  label?: string;
  icon?: Icon;
  disabled: boolean;
}

export interface SvelteTabsContext {
  selectedIndex: () => number | null;
  focusableIndex: () => number;
  variant: () => TabsVariant;
  tabsId: () => string;
  hasPanels: () => boolean;
  indexOf: (tab: TabRegistration) => number | undefined;
  registerTab: (tab: TabRegistration) => () => void;
  select: (index: number) => void;
}

export const TABS_CONTEXT = Symbol('udixio-tabs-context');
export const setTabsContext = (context: SvelteTabsContext) => setContext(TABS_CONTEXT, context);
export const getTabsContext = () => getContext<SvelteTabsContext | undefined>(TABS_CONTEXT);
