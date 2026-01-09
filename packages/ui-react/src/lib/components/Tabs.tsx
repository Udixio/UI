import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TabsInterface } from '../interfaces/tabs.interface';

import { useTabsStyle } from '../styles/tabs.style';
import { ReactProps } from '../utils/component';
import { TabProps } from '../interfaces/tab.interface';
import { Tab } from './Tab';

/**
 * Tabs organize content across different screens and views
 * @status beta
 * @category Navigation
 */
export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  setSelectedTab: externalSetSelectedTab,
  scrollable = false,
}: ReactProps<TabsInterface>) => {
  const [internalSelectedTab, internalSetSelectedTab] = useState<number | null>(
    null,
  );

  let selectedTab: number | null;
  if (externalSelectedTab == 0 || externalSelectedTab != undefined) {
    selectedTab = externalSelectedTab;
  } else {
    selectedTab = internalSelectedTab;
  }

  const setSelectedTab = externalSetSelectedTab || internalSetSelectedTab;

  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab,
  ) as React.ReactElement<TabProps>[];

  const ref = React.useRef<HTMLDivElement | null>(null);

  const handleOnTabSelected = (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
        ref: React.RefObject<any>;
      },
  ) => {
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

  const tabsId = useMemo(() => uuidv4(), []);

  // Collecter les panels (children des Tab qui ne sont pas des strings utilisés comme label)
  const panels = tabChildren.map((child) => {
    const { children: tabChildren, label } = child.props;
    // Si children est un string et pas de label → c'est le label, pas un panel
    if (typeof tabChildren === 'string' && !label) {
      return null;
    }
    return tabChildren;
  });

  const hasPanels = panels.some((panel) => panel != null);

  const styles = useTabsStyle({
    children,
    onTabSelected,
    scrollable,
    selectedTab,
    setSelectedTab,
    className,
    variant,
    hasPanels,
  });

  return (
    <>
      <div ref={ref} role="tablist" className={styles.tabs}>
        {tabChildren.map((child, index) => {
          return React.cloneElement(child, {
            key: index,
            index,
            variant: variant,
            selectedTab,
            setSelectedTab: setSelectedTab,
            tabsId: tabsId,
            onTabSelected: handleOnTabSelected,
            scrollable,
          });
        })}
      </div>
      {hasPanels && (
        <div className={styles.panels}>
          {panels.map((panel, index) => (
            <div
              key={index}
              role="tabpanel"
              aria-labelledby={`tab-${tabsId}-${index}`}
              hidden={selectedTab !== index}
              className={styles.panel}
            >
              {panel}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
