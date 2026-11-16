import { getContext, setContext } from 'svelte';
import type { ComponentMotion, Icon, NavigationRailMenuState } from '@udixio/core';

export interface RailItemRegistration {
  element?: HTMLElement;
  label?: string;
  icon?: Icon;
  extendedOnly: boolean;
}

export interface SvelteNavigationRailContext {
  isExtended: () => boolean;
  selectedIndex: () => number | null;
  /** The motion of the rail, which its items take for their labels and surfaces. */
  motion: () => ComponentMotion | undefined;
  indexOf: (registration: RailItemRegistration) => number | undefined;
  registerItem: (registration: RailItemRegistration) => () => void;
  registerSection: () => () => void;
  select: (index: number) => void;
  menu: () => { closed: NavigationRailMenuState; opened: NavigationRailMenuState };
}

export const NAVIGATION_RAIL_CONTEXT = Symbol('udixio-navigation-rail-context');
export const setNavigationRailContext = (context: SvelteNavigationRailContext) => setContext(NAVIGATION_RAIL_CONTEXT, context);
export const getNavigationRailContext = () => getContext<SvelteNavigationRailContext | undefined>(NAVIGATION_RAIL_CONTEXT);
