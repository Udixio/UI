import React from 'react';
import { TabPanelInterface } from '@udixio/styles';
import { ReactProps } from '@udixio/styles';
import { useTabPanelStyle } from '@udixio/styles';

/**
 * TabPanel contains the content for a single tab
 * Must be used within TabPanels
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Should be rendered inside `TabPanels` for animations and aria wiring.
 */
export const TabPanel = ({
  children,
  className,
  isSelected = false,
}: ReactProps<TabPanelInterface>) => {
  const styles = useTabPanelStyle({
    children,
    className,
    isSelected,
  });

  return <div className={styles.tabPanel}>{children}</div>;
};
