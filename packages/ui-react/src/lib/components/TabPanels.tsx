import React, {
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  type ReactProps,
  type TabPanelsInterface,
  tabPanelsStyle,
} from '@udixio/core';
import { animateTabPanelEnter } from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';
import { TabGroupContext } from './TabGroupContext';
import { TabPanel, type ReactTabPanelProps } from './TabPanel';

export type ReactTabPanelsProps = ReactProps<TabPanelsInterface> & {
  children?: ReactNode;
};

export const useTabPanelsStyle = createUseStyle(tabPanelsStyle);

/**
 * TabPanels renders the panel for the selected tab, sliding it in from the
 * direction the selection moved. The slide is driven by a shared
 * `@udixio/core/dom` Motion controller, the same one the Angular adapter
 * uses.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Requires a `TabGroup` ancestor; otherwise it renders nothing (and warns).
 * @a11y
 * - Renders a plain wrapper `div`; the `tabpanel` role and its `id`/
 *   `aria-labelledby` pair live on the connected `TabPanel`.
 * @limitations
 * - Only the active panel is mounted; there is no offscreen preservation of
 *   the other panels' state.
 */
export const TabPanels = ({ children, className }: ReactTabPanelsProps) => {
  const context = useContext(TabGroupContext);
  const selectedTab = context?.selectedTab ?? null;
  const direction = context?.direction ?? 0;
  const tabsId = context?.tabsId;

  const panelChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === TabPanel,
  ) as React.ReactElement<ReactTabPanelProps>[];

  const styles = useTabPanelsStyle({ className });

  const panelRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!panelRef.current) return;
    const animation = animateTabPanelEnter({
      panel: panelRef.current,
      direction,
    });
    return () => animation?.stop();
    // direction is intentionally read fresh from the closure: TabGroup
    // resolves it during render, before TabPanels re-renders with the new
    // selectedTab, so it is already correct by the time this effect fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  if (!context) {
    console.warn('TabPanels must be used within a TabGroup');
    return null;
  }

  const activePanel =
    selectedTab != null ? panelChildren[selectedTab] : undefined;

  return (
    <div className={styles.tabPanels}>
      {activePanel &&
        React.cloneElement(activePanel, {
          key: selectedTab,
          index: selectedTab ?? undefined,
          tabsId,
          ref: panelRef,
        })}
    </div>
  );
};
