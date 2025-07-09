import React, { useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ReactProps } from '../utils';
import { NavigationRailItem } from './NavigationRailItem';
import { Fab } from './Fab';
import { navigationRailStyle } from '../styles/navigation-rail.style';
import { NavigationRailInterface } from '../interfaces/navigation-rail.interface';
import { FabInterface, NavigationRailItemInterface } from '../interfaces';

export const NavigationRail = ({
  variant = 'standard',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  isExtended,
  alignment,
  setSelectedTab: externalSetSelectedTab,
}: ReactProps<NavigationRailInterface>) => {
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

  const ref = React.useRef<HTMLDivElement | null>(null);

  const handleOnTabSelected = (
    args: { index: number } & Pick<
      ReactProps<NavigationRailItemInterface>,
      'label' | 'icon'
    > & {
        ref: React.RefObject<any>;
      }
  ) => {
    onTabSelected?.(args);
  };

  const childrenArray = React.Children.toArray(children);

  const fab = childrenArray.filter(
    (child) => React.isValidElement(child) && child.type === Fab
  );

  const tabsId = useMemo(() => uuidv4(), []);

  const styles = navigationRailStyle({
    children,
    onTabSelected,
    selectedTab,
    setSelectedTab,
    className,
    variant,
    isExtended,
    alignment: 'top',
  });

  return (
    <div ref={ref} className={styles.navigationRail}>
      {fab.length > 0 &&
        React.cloneElement(
          fab[0] as React.ReactElement<ReactProps<FabInterface>>,
          {
            className: '!shadow-none ' + (fab[0] as any).props.className,
          }
        )}

      <div className={styles.segments}>
        {childrenArray.map((child, index) => {
          if (
            React.isValidElement(child) &&
            child.type === NavigationRailItem
          ) {
            return React.cloneElement(
              child as React.ReactElement<
                ReactProps<NavigationRailItemInterface>
              >,
              {
                key: index,
                index,
                variant: isExtended ? 'horizontal' : 'vertical',
                selectedTab,
                setSelectedTab: setSelectedTab,
                tabsId: tabsId,
                onTabSelected: handleOnTabSelected,
              }
            );
          }
          if (React.isValidElement(child) && child.type === Fab) {
            return null;
          }
          return child;
        })}
      </div>
      <div></div>
    </div>
  );
};
