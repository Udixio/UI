import React, {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type ReactProps, type TabsInterface, tabsStyle } from '@udixio/core';

import { createUseStyle } from '../utils/create-use-style';
import { Tab, type ReactTabProps, type TabSelectedEvent } from './Tab';
import { TabGroupContext } from './TabGroupContext';

export type { TabsVariant } from '@udixio/core';

export type ReactTabsProps = ReactProps<TabsInterface> & {
  children?: ReactNode;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  onTabSelected?: (args: TabSelectedEvent) => void;
};

export const useTabsStyle = createUseStyle(tabsStyle);

/**
 * Tabs organize content across different screens and views
 * @status beta
 * @category Navigation
 * @devx
 * - Can be controlled via `selectedTab`/`setSelectedTab` or through `TabGroup`.
 * @a11y
 * - No keyboard navigation or roving tabindex.
 */
export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  setSelectedTab: externalSetSelectedTab,
  scrollable = false,
}: ReactTabsProps) => {
  const tabGroupContext = useContext(TabGroupContext);

  const [internalSelectedTab, internalSetSelectedTab] = useState<number | null>(
    null,
  );

  // Priorité : props > context > état interne
  let selectedIndex: number | null;
  if (externalSelectedTab === 0 || externalSelectedTab != undefined) {
    selectedIndex = externalSelectedTab;
  } else if (tabGroupContext) {
    selectedIndex = tabGroupContext.selectedTab;
  } else {
    selectedIndex = internalSelectedTab;
  }

  const setSelectedTab =
    externalSetSelectedTab ??
    tabGroupContext?.setSelectedTab ??
    internalSetSelectedTab;

  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab,
  ) as React.ReactElement<ReactTabProps>[];

  const ref = React.useRef<HTMLDivElement | null>(null);

  const handleOnTabSelected = (args: TabSelectedEvent) => {
    onTabSelected?.(args);

    if (scrollable) {
      const tabs: HTMLElement = ref.current!;
      const tabSelected: HTMLElement = args.ref.current;
      if (tabs && tabSelected) {
        const scrollLeft =
          tabSelected.offsetLeft +
          tabSelected.offsetWidth / 2 -
          tabs.offsetWidth / 2;
        tabs.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  };

  const tabsId = useMemo(
    () => tabGroupContext?.tabsId ?? uuidv4(),
    [tabGroupContext?.tabsId],
  );

  const styles = useTabsStyle({
    variant,
    scrollable,
    selectedTab: externalSelectedTab,
    selectedIndex,
    className,
  });

  return (
    <div ref={ref} role="tablist" className={styles.tabs}>
      {tabChildren.map((child, index) => {
        return React.cloneElement(child, {
          key: index,
          index,
          variant: variant,
          selectedTab: selectedIndex,
          setSelectedTab: setSelectedTab,
          tabsId: tabsId,
          onTabSelected: handleOnTabSelected,
        });
      })}
    </div>
  );
};
