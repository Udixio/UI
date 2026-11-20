import React, {
  type ReactNode,
  type RefObject,
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
 * TabPanels renders every panel of the group and shows the selected one,
 * sliding it in from the direction the selection moved. The slide is driven
 * by a shared `@udixio/core/dom` controller on `@udixio/motion`, the same one
 * the Angular adapter uses.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Requires a `TabGroup` ancestor; otherwise it renders nothing (and warns).
 * - Every panel stays in the DOM, hidden while inactive, so its content is in the server HTML. A `lazy` panel renders only while it is selected.
 * @a11y
 * - Renders a plain wrapper `div`; the `tabpanel` role and its `id`/
 *   `aria-labelledby` pair live on the connected `TabPanel`.
 * @limitations
 * - An inactive panel that is not `lazy` keeps its state, but it is not rendered to the reader while hidden.
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

  const panelRefs = useRef<RefObject<HTMLDivElement | null>[]>([]);
  const panelRef = (index: number) => {
    let ref = panelRefs.current[index];
    if (!ref) {
      ref = { current: null };
      panelRefs.current[index] = ref;
    }
    return ref;
  };

  useLayoutEffect(() => {
    const panel =
      selectedTab != null ? panelRefs.current[selectedTab]?.current : null;
    if (!panel) return;
    const animation = animateTabPanelEnter({ panel, direction });
    return () => animation?.cancel();
    // direction is intentionally read fresh from the closure: TabGroup
    // resolves it during render, before TabPanels re-renders with the new
    // selectedTab, so it is already correct by the time this effect fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  if (!context) {
    console.warn('TabPanels must be used within a TabGroup');
    return null;
  }

  return (
    <div className={styles.tabPanels}>
      {panelChildren.map((panel, index) => {
        const active = index === selectedTab;
        if (panel.props.lazy && !active) return null;
        return React.cloneElement(panel, {
          index,
          tabsId,
          hidden: !active,
          ref: panelRef(index),
        });
      })}
    </div>
  );
};
