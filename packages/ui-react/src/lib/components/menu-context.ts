import { createContext, useContext } from 'react';
import type { MenuPurpose, MenuVariant } from '@udixio/core';

export interface MenuContextValue {
  purpose: MenuPurpose;
  variant: MenuVariant;
}

export const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext(): MenuContextValue {
  return (
    useContext(MenuContext) ?? {
      purpose: 'actions',
      variant: 'standard',
    }
  );
}
