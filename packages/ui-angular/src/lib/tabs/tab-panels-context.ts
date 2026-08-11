import { InjectionToken } from '@angular/core';

export interface TabPanelsContext {
  /** This panel's position among `udx-tab-panel` siblings, or `undefined` if untracked. */
  indexOf(panel: object): number | undefined;
}

export const TAB_PANELS_CONTEXT = new InjectionToken<TabPanelsContext>(
  'TAB_PANELS_CONTEXT',
);
