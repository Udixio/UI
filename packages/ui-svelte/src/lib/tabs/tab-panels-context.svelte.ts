import { getContext, setContext } from 'svelte';
import type { TabPanelRegistration } from './tab-panel-registration.svelte';
export type { TabPanelRegistration } from './tab-panel-registration.svelte';

export interface SvelteTabPanelsContext {
  indexOf: (panel: TabPanelRegistration) => number | undefined;
  registerPanel: (panel: TabPanelRegistration) => () => void;
}

export const TAB_PANELS_CONTEXT = Symbol('udixio-tab-panels-context');
export const setTabPanelsContext = (context: SvelteTabPanelsContext) => setContext(TAB_PANELS_CONTEXT, context);
export const getTabPanelsContext = () => getContext<SvelteTabPanelsContext | undefined>(TAB_PANELS_CONTEXT);
