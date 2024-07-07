import React, {
  ForwardRefExoticComponent,
  ReactNode,
  SetStateAction,
  useMemo,
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
  selectedTab?: React.ForwardRefExoticComponent<
    HTMLButtonElement | HTMLAnchorElement
  > | null;
  setSelectedTab?: SetStateAction<ForwardRefExoticComponent<
    HTMLButtonElement | HTMLAnchorElement
  > | null>;
  className?: string;
}

export const Tabs = ({
  variant = 'primary',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  setSelectedTab: externalSetSelectedTab,
}: TabsProps) => {
  const [internalSelectedTab, internalSetSelectedTab] = useState(null);

  const selectedTab = externalSelectedTab || internalSelectedTab;
  const setSelectedTab = externalSetSelectedTab || internalSetSelectedTab;

  const tabChildren = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  );

  const tabsId = useMemo(() => uuidv4(), []);
  return (
    <div
      role="tablist"
      className={classnames(
        className,
        'border-b border-surface-container-highest',
        'flex relative'
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
          onTabSelected: onTabSelected,
        });
      })}
    </div>
  );
};
