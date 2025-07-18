import React, { useEffect, useRef, useState } from 'react';
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
  onItemSelected,
  children,
  className,
  selectedItem: externalSelectedItem,
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
  onExtendedChange,
  transition,
  setSelectedItem: externalSetSelectedItem,
}: ReactProps<NavigationRailInterface>) => {
  const [internalSelectedItem, internalSetSelectedItem] = useState<
    number | null
  >(null);

  const [isExtended, setIsExtended] = useState(extended);

  let selectedItem: number | null;
  if (externalSelectedItem == 0 || externalSelectedItem != undefined) {
    selectedItem = externalSelectedItem;
  } else {
    selectedItem = internalSelectedItem;
  }

  const setSelectedItem = externalSetSelectedItem || internalSetSelectedItem;

  const ref = React.useRef<HTMLDivElement | null>(null);

  const handleOnItemSelected = (
    args: { index: number } & Pick<
      ReactProps<NavigationRailItemInterface>,
      'label' | 'icon'
    > & {
        ref: React.RefObject<any>;
      }
  ) => {
    onItemSelected?.(args);
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

  const styles = navigationRailStyle({
    children,
    onItemSelected,
    selectedItem,
    setSelectedItem,
    className,
    variant,
    extended: isExtended,
    isExtended,
    alignment,
    menu,
    transition,
    onExtendedChange,
  });
  transition = { duration: 0.3, ...transition };
  const extendedOnly = useRef(false);
  extendedOnly.current = false;

  useEffect(() => {
    onExtendedChange?.(isExtended ?? false);
  }, [isExtended]);

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
          className={styles.menuIcon}
          icon={!isExtended ? menu?.closed.icon : menu.opened.icon}
        />
        {fab.length > 0 &&
          React.cloneElement(
            fab[0] as React.ReactElement<ReactProps<FabInterface>>,
            {
              transition: transition,
              isExtended: isExtended,
              className: '!shadow-none mx-5 ' + (fab[0] as any).props.className,
            }
          )}
      </div>

      <div className={styles.segments}>
        {(() => {
          let itemIndex = 0;
          return childrenArray.map((child) => {
            if (
              React.isValidElement(child) &&
              child.type === NavigationRailItem
            ) {
              return React.cloneElement(
                child as React.ReactElement<
                  ReactProps<NavigationRailItemInterface>
                >,
                {
                  key: itemIndex,
                  index: itemIndex++, // Utilise et incrémente le compteur dédié
                  variant: isExtended ? 'horizontal' : 'vertical',
                  selectedItem,
                  setSelectedItem: setSelectedItem,
                  onItemSelected: handleOnItemSelected,
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
          });
        })()}
      </div>
      <div className={'flex-1 max-h-[160px]'}></div>
    </div>
  );
};
