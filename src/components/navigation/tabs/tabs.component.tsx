import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TabsProps } from './tabs.interface';
import { Tab, TabProps } from './tab';
import { tabsStyle } from './tabs.style';

export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  setSelectedTab: externalSetSelectedTab,
  scrollable = false,
}: TabsProps) => {
  const [internalSelectedTab, internalSetSelectedTab] = useState<number | null>(
    null
  );

  let selectedTab: number | null;
  if (externalSelectedTab == 0 || externalSelectedTab != undefined) {
    selectedTab = externalSelectedTab;
  } else {
    selectedTab = internalSelectedTab;
  }

  const setSelectedTab = externalSetSelectedTab || internalSetSelectedTab;

  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  const ref = React.useRef<HTMLDivElement | null>(null);

  const handleOnTabSelected = (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
        ref: React.RefObject<any>;
      }
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

  const styles = tabsStyle({
    children,
    onTabSelected,
    scrollable,
    selectedTab,
    setSelectedTab,
    className,
    variant,
  });
  return (
    <div ref={ref} role="tablist" className={styles.tabs}>
      {tabChildren.map((child, index) => {
        return React.cloneElement(child as React.ReactElement<TabProps>, {
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
  );
};
