import { createContext, Dispatch, SetStateAction } from 'react';

export interface TabGroupContextValue {
  selectedTab: number | null;
  setSelectedTab: Dispatch<SetStateAction<number | null>>;
  previousTab: number | null;
  direction: number;
  tabsId: string;
}

export const TabGroupContext = createContext<TabGroupContextValue | null>(null);