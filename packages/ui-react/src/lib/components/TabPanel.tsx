import type { ReactNode } from 'react';
import {
  type ReactProps,
  type TabPanelInterface,
  tabPanelStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactTabPanelProps = ReactProps<TabPanelInterface> & {
  /** Renders the content only while this panel is selected. By default every panel stays in the DOM, hidden while inactive. */
  lazy?: boolean;
  children?: ReactNode;
};

export const useTabPanelStyle = createUseStyle(tabPanelStyle);

/**
 * TabPanel holds the content for a single tab. Its parent `TabPanels` keeps
 * every panel in the DOM and hides the inactive ones.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Must be rendered inside a `TabPanels`, itself inside a `TabGroup`.
 * - Pass `lazy` for heavy content that should render only while the panel is selected.
 * @a11y
 * - Exposes `role="tabpanel"`, an `id`/`aria-labelledby` pair matching the
 *   connected `Tab`, and `tabIndex={0}` so keyboard users can move focus
 *   into the panel content. An inactive panel is `hidden`.
 * @limitations
 * - A `lazy` panel unmounts when it stops being the selected panel; its scroll position, form input, and focus are not preserved across a switch.
 */
export const TabPanel = ({
  children,
  className,
  index,
  tabsId,
  hidden,
  ref,
}: ReactTabPanelProps) => {
  const styles = useTabPanelStyle({ index, tabsId, className });

  const domId =
    tabsId != null && index != null ? `tabpanel-${tabsId}-${index}` : undefined;
  const labelledBy =
    tabsId != null && index != null ? `tab-${tabsId}-${index}` : undefined;

  return (
    <div
      ref={ref as any}
      id={domId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={hidden}
      tabIndex={0}
      className={styles.tabPanel}
    >
      {children}
    </div>
  );
};
