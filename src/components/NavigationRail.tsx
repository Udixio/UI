import React, { useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ReactProps } from '../utils';
import {
  NavigationRailItem,
  NavigationRailSection,
} from './NavigationRailItem';
import { Fab } from './Fab';
import { navigationRailStyle } from '../styles/navigation-rail.style';
import { NavigationRailInterface } from '../interfaces/navigation-rail.interface';
import { FabInterface, NavigationRailItemInterface } from '../interfaces';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from './IconButton';

export const NavigationRail = ({
  variant = 'standard',
  onTabSelected,
  children,
  className,
  selectedTab: externalSelectedTab,
  extended,
  alignment = 'top',
  menu = {
    closed: {
      icon: faBars,
      label: 'Open menu',
    },
    opened: {
      icon: faXmark,
      label: 'Close menu',
    },
  },
  style,
  transition,
  setSelectedTab: externalSetSelectedTab,
}: ReactProps<NavigationRailInterface>) => {
  const [internalSelectedTab, internalSetSelectedTab] = useState<number | null>(
    null
  );

  const [isExtended, setIsExtended] = useState(extended);

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

  function flattenChildren(children: React.ReactNode): React.ReactNode[] {
    const flatChildren: React.ReactNode[] = [];
    React.Children.forEach(children, (child) => {
      if (
        React.isValidElement<{ children?: React.ReactNode }>(child) &&
        child.type === React.Fragment
      ) {
        flatChildren.push(...flattenChildren(child.props.children));
      } else {
        flatChildren.push(child);
      }
    });
    return flatChildren;
  }

  const childrenArray = flattenChildren(children);

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
    extended: isExtended,
    isExtended,
    alignment,
    menu,
    transition,
  });
  transition = { duration: 0.3, ...transition };
  const extendedOnly = useRef(false);
  extendedOnly.current = false;
  return (
    <div
      style={{ transition: transition.duration + 's', ...style }}
      ref={ref}
      className={styles.navigationRail}
    >
      <div className={styles.header}>
        <IconButton
          onClick={() => setIsExtended(!isExtended)}
          arialLabel={isExtended ? menu?.opened.label : menu?.closed.label}
          title={isExtended ? menu?.opened.label : menu?.closed.label}
          className={styles.menuIcon}
          icon={!isExtended ? menu?.closed.icon : menu.opened.icon}
        />
        {fab.length > 0 &&
          React.cloneElement(
            fab[0] as React.ReactElement<ReactProps<FabInterface>>,
            {
              transition: transition,
              isExtended: isExtended,
              className: '!shadow-none ml-5 ' + (fab[0] as any).props.className,
            }
          )}
      </div>

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
                transition,
                extendedOnly: extendedOnly.current,
                isExtended,
              }
            );
          }
          if (React.isValidElement(child) && child.type === Fab) {
            return null;
          }
          if (
            React.isValidElement(child) &&
            child.type === NavigationRailSection
          ) {
            extendedOnly.current = true;
            if (!isExtended) return null;
            return React.cloneElement(
              child as React.ReactElement<{ label: string }>,
              {}
            );
          }
          return child;
        })}
      </div>
      <div></div>
    </div>
  );
};
