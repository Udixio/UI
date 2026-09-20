import { getContext, setContext } from 'svelte';

export interface SvelteTabGroupContext {
  selectedIndex: () => number | null;
  direction: () => number;
  tabsId: () => string;
  select: (index: number | null) => void;
}

export const TAB_GROUP_CONTEXT = Symbol('udixio-tab-group-context');
export const setTabGroupContext = (context: SvelteTabGroupContext) => setContext(TAB_GROUP_CONTEXT, context);
export const getTabGroupContext = () => getContext<SvelteTabGroupContext | undefined>(TAB_GROUP_CONTEXT);
