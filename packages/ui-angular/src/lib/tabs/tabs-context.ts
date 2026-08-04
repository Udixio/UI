import { InjectionToken, type Signal } from '@angular/core';
import type { TabsVariant } from '@udixio/core';

export interface TabsContext {
  readonly selectedIndex: Signal<number | null>;
  /** The roving-tabindex stop while nothing (or a disabled tab) is selected. */
  readonly focusableIndex: Signal<number>;
  readonly variant: Signal<TabsVariant>;
  readonly tabsId: Signal<string>;
  /** Whether a connected `lib-tab-panels` exists (wires `aria-controls`). */
  readonly hasPanels: Signal<boolean>;
  select(index: number): void;
  /** This tab's position among `lib-tab` siblings, or `undefined` if untracked. */
  indexOf(tab: object): number | undefined;
}

export const TABS_CONTEXT = new InjectionToken<TabsContext>('TABS_CONTEXT');
