import { InjectionToken, type Signal } from '@angular/core';
import type { ComponentMotion } from '@udixio/core';

export interface NavigationRailContext {
  readonly isExtended: Signal<boolean>;
  readonly selectedIndex: Signal<number | null>;
  /** The motion of the rail, which its items take for their labels and surfaces. */
  readonly motion: Signal<ComponentMotion | undefined>;
  select(index: number): void;
  /** This item's position among `udx-navigation-rail-item` siblings, or `undefined` if untracked. */
  indexOf(item: object): number | undefined;
  /** Whether a `udx-navigation-rail-section` precedes this item, hiding it while collapsed. */
  hasPrecedingSection(item: object): boolean;
}

export const NAVIGATION_RAIL_CONTEXT = new InjectionToken<NavigationRailContext>(
  'NAVIGATION_RAIL_CONTEXT',
);
