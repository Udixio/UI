import React, { useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TabGroupContext, TabGroupContextValue } from './TabGroupContext';
import { TabGroupInterface } from '../interfaces/tab-group.interface';
import { ReactProps } from '../utils/component';

/**
 * TabGroup provides shared state for Tabs and TabPanels
 * @status beta
 * @category Navigation
 */
export const TabGroup = ({
  children,
  selectedTab: externalSelectedTab,
  setSelectedTab: externalSetSelectedTab,
  defaultTab = 0,
}: ReactProps<TabGroupInterface>) => {
  const [internalSelectedTab, internalSetSelectedTab] = useState<number | null>(
    defaultTab,
  );
  const previousTabRef = useRef<number | null>(null);

  // Priorité : props externes > état interne
  const selectedTab =
    externalSelectedTab !== undefined ? externalSelectedTab : internalSelectedTab;

  const setSelectedTab = externalSetSelectedTab ?? internalSetSelectedTab;

  // Calculer la direction du slide
  const direction =
    previousTabRef.current !== null && selectedTab !== null
      ? selectedTab > previousTabRef.current
        ? 1
        : -1
      : 0;

  // Mettre à jour la référence précédente
  if (selectedTab !== previousTabRef.current) {
    previousTabRef.current = selectedTab;
  }

  const tabsId = useMemo(() => uuidv4(), []);

  const contextValue: TabGroupContextValue = useMemo(
    () => ({
      selectedTab,
      setSelectedTab,
      previousTab: previousTabRef.current,
      direction,
      tabsId,
    }),
    [selectedTab, setSelectedTab, direction, tabsId],
  );

  return (
    <TabGroupContext.Provider value={contextValue}>
      {children}
    </TabGroupContext.Provider>
  );
};
