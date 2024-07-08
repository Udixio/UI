import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Tab, TabProps } from './Tab';
import classnames from 'classnames';
import { v4 as uuidv4 } from 'uuid';

export type TabsVariant = 'primary' | 'secondary';

export interface TabsProps {
  variant?: TabsVariant;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'>
  ) => void;
  children: ReactNode;
  stateVariant?: 'fit' | 'full';
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  className?: string;
  scrollable?: boolean;
}

export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  setSelectedTab: externalSetSelectedTab,
  scrollable,
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

  const ref = useRef();

  const handleOnTabSelected = (args) => {
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
  return (
    <div
      ref={ref}
      role="tablist"
      className={classnames(
        className,
        'border-b border-surface-container-highest',
        'flex relative ',
        { 'overflow-x-auto': scrollable }
      )}
    >
      {tabChildren.map((child, index) => {
        return React.cloneElement(child as React.ReactElement, {
          key: index,
          tabIndex: index,
          variant: variant,
          selectedTab: selectedTab,
          setSelectedTab: setSelectedTab,
          tabsId: tabsId,
          onTabSelected: handleOnTabSelected,
          scrollable,
        });
      })}
    </div>
  );
};
