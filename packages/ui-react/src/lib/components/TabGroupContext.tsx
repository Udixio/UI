import { createContext, Dispatch, SetStateAction } from 'react';

/**
 * Shared state container for Tabs and TabPanels.
 * @parent Tabs
 * @internal
 */
export interface TabGroupContextValue {
  selectedTab: number | null;
  setSelectedTab: Dispatch<SetStateAction<number | null>>;
  previousTab: number | null;
  direction: number;
  tabsId: string;
}

export const TabGroupContext = createContext<TabGroupContextValue | null>(null);
