import { createContext } from 'react';

/**
 * Shared selection state connecting a `Tabs` tablist with a `TabPanels`
 * placed anywhere in the same `TabGroup` subtree.
 * @parent Tabs
 * @internal
 */
export interface TabGroupContextValue {
  selectedTab: number | null;
  direction: number;
  tabsId: string;
  select(index: number | null): void;
}

export const TabGroupContext = createContext<TabGroupContextValue | null>(
  null,
);
