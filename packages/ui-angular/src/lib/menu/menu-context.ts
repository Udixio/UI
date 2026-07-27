import { InjectionToken } from '@angular/core';
import type { MenuPurpose, MenuVariant } from '@udixio/core';

export interface MenuContext {
  purpose(): MenuPurpose;
  variant(): MenuVariant;
}

export const MENU_CONTEXT = new InjectionToken<MenuContext>('MENU_CONTEXT');
