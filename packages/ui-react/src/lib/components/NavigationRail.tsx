import {
  Children,
  cloneElement,
  type Dispatch,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type SetStateAction,
  useRef,
  useState,
} from 'react';
import type { Transition } from 'motion';
import {
  getNextNavigationRailExtended,
  type NavigationRailInterface,
  navigationRailStyle,
  type ReactProps,
} from '@udixio/core';
import {
  NavigationRailItem,
  type NavigationRailItemSelectedEvent,
  type ReactNavigationRailItemProps,
} from './NavigationRailItem';
import { NavigationRailSection } from './NavigationRailSection';
import { Fab, type ReactFabProps } from './Fab';
import { createUseStyle } from '../utils/create-use-style';
import { useControllableState } from '../utils/use-controllable-state';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iMenu } from '@udixio/icons-rounded-400/menu';
import { IconButton } from './IconButton';

export type ReactNavigationRailProps = ReactProps<NavigationRailInterface> & {
  children?: ReactNode;
  /** Content pinned below the item list (e.g. an account or sign-out action). */
  footer?: ReactNode;
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
 * - `footer` pins arbitrary content (e.g. a sign-out button) below the items,
 *   without needing to wrap the rail in a custom layout.
 * @a11y
 * - The menu toggle button exposes its open/closed label via `menu.opened`/
 *   `menu.closed`; there is no additional live region for the extended state.
 * @limitations
 * - Keyboard navigation/roving tabindex is not implemented.
 */
export const NavigationRail = ({
  variant = 'standard',
  onItemSelected,
  children,
  footer,
  className,
  selectedItem: externalSelectedItem,
  extended,
  defaultExtended,
  alignment = 'top',
  menu = {
    closed: {
      icon: iMenu,
      label: 'Open menu',
    },
    opened: {
      icon: iClose,
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

  const [isExtended, setIsExtended] = useControllableState({
    value: extended,
    defaultValue: defaultExtended ?? false,
    onChange: onExtendedChange,
    componentName: 'NavigationRail',
    stateName: 'extended',
  });

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
    defaultExtended,
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

  return (
    <div
      style={{ transition: transition.duration + 's', ...style }}
      ref={ref}
      className={styles.navigationRail}
    >
      <div className={styles.header}>
        <IconButton
          onClick={() => setIsExtended(getNextNavigationRailExtended(isExtended))}
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
          return childrenArray.map((child, arrIndex) => {
            if (isValidElement(child) && child.type === NavigationRailItem) {
              return cloneElement(
                child as ReactElement<ReactNavigationRailItemProps>,
                {
                  // La clé React doit être unique parmi TOUS les enfants de
                  // segments (items + sections) : arrIndex l'est toujours,
                  // alors qu'itemIndex (compteur dédié aux seuls items) peut
                  // entrer en collision avec l'arrIndex d'une section placée
                  // plus tôt, provoquant une réconciliation incorrecte (ex:
                  // le texte d'une NavigationRailSection dupliqué après clic).
                  key: arrIndex,
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
              return cloneElement(child as ReactElement<{ label: string }>, {
                key: arrIndex,
              });
            }
            return child;
          });
        })()}
      </div>
      <div className={styles.footer}>{footer}</div>
    </div>
  );
};
