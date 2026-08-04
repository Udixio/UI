import { InjectionToken, type Signal } from '@angular/core';

export interface TabGroupContext {
  /** Resolved selected index (distinct from the `selectedTab` input, which only holds the controlled value). */
  readonly selectedIndex: Signal<number | null>;
  readonly direction: Signal<number>;
  readonly tabsId: Signal<string>;
  select(index: number | null): void;
}

export const TAB_GROUP_CONTEXT = new InjectionToken<TabGroupContext>(
  'TAB_GROUP_CONTEXT',
);
