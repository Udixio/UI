import { InjectionToken, type Signal } from '@angular/core';

export interface NavigationRailContext {
  readonly isExtended: Signal<boolean>;
  readonly selectedIndex: Signal<number | null>;
  select(index: number): void;
  /** This item's position among `lib-navigation-rail-item` siblings, or `undefined` if untracked. */
  indexOf(item: object): number | undefined;
  /** Whether a `lib-navigation-rail-section` precedes this item, hiding it while collapsed. */
  hasPrecedingSection(item: object): boolean;
}

export const NAVIGATION_RAIL_CONTEXT = new InjectionToken<NavigationRailContext>(
  'NAVIGATION_RAIL_CONTEXT',
);
