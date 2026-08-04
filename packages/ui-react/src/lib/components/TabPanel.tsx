import type { ReactNode } from 'react';
import {
  type ReactProps,
  type TabPanelInterface,
  tabPanelStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactTabPanelProps = ReactProps<TabPanelInterface> & {
  children?: ReactNode;
};

export const useTabPanelStyle = createUseStyle(tabPanelStyle);

/**
 * TabPanel holds the content for a single tab. Its parent `TabPanels` only
 * ever mounts the active panel.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Must be rendered inside a `TabPanels`, itself inside a `TabGroup`.
 * @a11y
 * - Exposes `role="tabpanel"`, an `id`/`aria-labelledby` pair matching the
 *   connected `Tab`, and `tabIndex={0}` so keyboard users can move focus
 *   into the panel content.
 * @limitations
 * - Unmounts when it stops being the active panel; scroll position, form
 *   input, and focus inside it are not preserved across a switch.
 */
export const TabPanel = ({
  children,
  className,
  index,
  tabsId,
  ref,
}: ReactTabPanelProps) => {
  const styles = useTabPanelStyle({ index, tabsId, className });

  const domId =
    tabsId != null && index != null
      ? `tabpanel-${tabsId}-${index}`
      : undefined;
  const labelledBy =
    tabsId != null && index != null ? `tab-${tabsId}-${index}` : undefined;

  return (
    <div
      ref={ref as any}
      id={domId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={0}
      className={styles.tabPanel}
    >
      {children}
    </div>
  );
};
