import {
  Children,
  cloneElement,
  type Dispatch,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Transition } from 'motion';
import {
  type NavigationRailInterface,
  navigationRailStyle,
  type ReactProps,
} from '@udixio/core';
import {
  NavigationRailItem,
  type NavigationRailItemSelectedEvent,
  NavigationRailSection,
  type ReactNavigationRailItemProps,
} from './NavigationRailItem';
import { Fab, type ReactFabProps } from './Fab';
import { createUseStyle } from '../utils/create-use-style';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from './IconButton';

export type ReactNavigationRailProps = ReactProps<NavigationRailInterface> & {
  children?: ReactNode;
  transition?: Transition;
  setSelectedItem?: Dispatch<SetStateAction<number | null>>;
  onItemSelected?: (args: NavigationRailItemSelectedEvent) => void;
};

export const useNavigationRailStyle = createUseStyle(navigationRailStyle);

/**
 * Navigation rails let people switch between UI views on mid-sized devices
 * @status beta
 * @category Navigation
 * @devx
 * - Treats `NavigationRailItem`, `NavigationRailSection`, and `Fab` specially.
 * - Selection is index-based; provide `selectedItem` for controlled usage.
 * @limitations
 * - `extended` is not fully controlled (prop changes after mount aren’t synced).
 * - Keyboard navigation/roving tabindex is not implemented.
 */
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
}: ReactNavigationRailProps) => {
  const [internalSelectedItem, internalSetSelectedItem] = useState<
    number | null
  >(null);

  const [isExtended, setIsExtended] = useState(extended ?? false);

  let selectedIndex: number | null;
  if (externalSelectedItem == 0 || externalSelectedItem != undefined) {
    selectedIndex = externalSelectedItem;
  } else {
    selectedIndex = internalSelectedItem;
  }

  const setSelectedItem = externalSetSelectedItem || internalSetSelectedItem;

  const ref = useRef<HTMLDivElement | null>(null);

  const handleOnItemSelected = (args: NavigationRailItemSelectedEvent) => {
    onItemSelected?.(args);
  };

  function flattenChildren(children: ReactNode): ReactNode[] {
    const flatChildren: ReactNode[] = [];
    Children.forEach(children, (child) => {
      if (
        isValidElement<{ children?: ReactNode }>(child) &&
        child.type === Fragment
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
    (child) => isValidElement(child) && child.type === Fab,
  );

  const styles = useNavigationRailStyle({
    variant,
    selectedItem: externalSelectedItem,
    extended,
    onExtendedChange,
    alignment,
    menu,
    isExtended,
    selectedIndex,
    className,
  });
  transition = { duration: 0.3, ...transition };
  const extendedOnly = useRef(false);
  extendedOnly.current = false;

  useEffect(() => {
    onExtendedChange?.(isExtended);
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
          label={isExtended ? menu?.opened.label : menu?.closed.label}
          className={styles.menuIcon}
          icon={!isExtended ? menu?.closed.icon : menu.opened.icon}
        />
        {fab.length > 0 &&
          cloneElement(fab[0] as ReactElement<ReactFabProps>, {
            extended: isExtended,
            className: '!shadow-none mx-5 ' + (fab[0] as any).props.className,
          })}
      </div>

      <div className={styles.segments}>
        {(() => {
          let itemIndex = 0;
          return childrenArray.map((child) => {
            if (isValidElement(child) && child.type === NavigationRailItem) {
              return cloneElement(
                child as ReactElement<ReactNavigationRailItemProps>,
                {
                  key: itemIndex,
                  index: itemIndex++, // Utilise et incrémente le compteur dédié
                  variant: isExtended ? 'horizontal' : 'vertical',
                  selectedItem: selectedIndex,
                  setSelectedItem: setSelectedItem,
                  onItemSelected: handleOnItemSelected,
                  transition,
                  extendedOnly: extendedOnly.current,
                  isExtended,
                },
              );
            }
            if (isValidElement(child) && child.type === Fab) {
              return null;
            }
            if (isValidElement(child) && child.type === NavigationRailSection) {
              extendedOnly.current = true;
              if (!isExtended) return null;
              return cloneElement(child as ReactElement<{ label: string }>, {});
            }
            return child;
          });
        })()}
      </div>
      <div className={'flex-1 max-h-[160px]'}></div>
    </div>
  );
};
