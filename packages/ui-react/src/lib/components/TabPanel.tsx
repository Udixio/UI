import React from 'react';
import { TabPanelInterface } from '../interfaces/tab-panels.interface';
import { ReactProps } from '../utils/component';
import { useTabPanelStyle } from '../styles/tab-panels.style';

/**
 * TabPanel contains the content for a single tab
 * Must be used within TabPanels
 * @status beta
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
