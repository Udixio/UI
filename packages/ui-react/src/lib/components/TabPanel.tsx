import type { ReactNode } from 'react';
import {
  type ReactProps,
  type TabPanelInterface,
  tabPanelStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactTabPanelProps = ReactProps<TabPanelInterface> & {
  children?: ReactNode;
  /** Injected by the parent TabPanels: whether this panel is the visible one. */
  isSelected?: boolean;
};

export const useTabPanelStyle = createUseStyle(tabPanelStyle);

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
}: ReactTabPanelProps) => {
  const styles = useTabPanelStyle({
    className,
    isSelected,
  });

  return <div className={styles.tabPanel}>{children}</div>;
};
