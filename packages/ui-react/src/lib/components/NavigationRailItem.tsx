import React, {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Transition } from 'motion';

import { Icon } from '../icon';
import {
  classNames,
  type NavigationRailItemInterface,
  navigationRailItemStyle,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { AnimatePresence, motion } from 'motion/react';
import { State } from '../effects';

/** Payload emitted when an item becomes the selected one. */
export type NavigationRailItemSelectedEvent = Pick<
  NavigationRailItemInterface['props'],
  'label' | 'icon'
> & {
  index: number;
  ref: RefObject<any>;
};

export type ReactNavigationRailItemProps =
  ReactProps<NavigationRailItemInterface> & {
    // `children` sert de repli de `label` → typé string (comme Fab / IconButton)
    children?: string;
    href?: string;
    transition?: Transition;
    setSelectedItem?: Dispatch<SetStateAction<number | null>>;
    onItemSelected?: (args: NavigationRailItemSelectedEvent) => void;
  };

export const useNavigationRailItemStyle = createUseStyle(
  navigationRailItemStyle,
);

/**
 * @status beta
 * @parent NavigationRail
 * @devx
 * - Section labels only render when the rail is extended.
 */
export const NavigationRailSection = ({ label }: { label: string }) => {
  return (
    <div className={' h-9 flex items-center mx-9 mt-3'}>
      <p className={'text-label-large text-on-surface-variant'}>{label}</p>
    </div>
  );
};

/**
 * @status beta
 * @parent NavigationRail
 * @devx
 * - Selection is index-based and provided by the parent rail.
 * - `extendedOnly` hides items when the rail is collapsed.
 * @a11y
 * - Uses `role="tab"` but no roving tabindex or aria-controls wiring.
 */
export const NavigationRailItem = ({
  className,
  onClick,
  label,
  variant = 'vertical',
  href,
  icon,
  selectedItem,
  setSelectedItem,
  index,
  onItemSelected,
  selected = false,
  ref,
  transition,
  isExtended,
  iconSelected,
  style,
  extendedOnly,
  children,
  ...restProps
}: ReactNavigationRailItemProps) => {
  if (children) label = children;

  const defaultRef = useRef<any>(null);
  const resolvedRef = ref || defaultRef;

  const [isSelected, setIsSelected] = useState<boolean>(selected);

  useEffect(() => {
    if (selected && selectedItem == null) {
      setIsSelected(true);
    } else {
      setIsSelected(selectedItem == index && index != null);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem == index && onItemSelected) {
      onItemSelected({
        ref: resolvedRef as any,
        index: index || 0,
        label,
        icon,
      });
    }
  }, [selectedItem]);

  const ElementType = href ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent<any>) => {
    if (setSelectedItem) {
      setSelectedItem(index ?? null);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const styles = useNavigationRailItemStyle({
    label,
    icon,
    iconSelected,
    selected,
    variant,
    index,
    selectedItem,
    isExtended,
    extendedOnly,
    isSelected,
    className,
  });

  transition = { duration: 0.3, ...transition };

  if (extendedOnly && !isExtended) return null;

  return (
    <ElementType
      {...(restProps as any)}
      role="tab"
      aria-selected={isSelected}
      ref={resolvedRef as any}
      href={href}
      className={styles.navigationRailItem}
      onClick={handleClick}
      style={{ transition: transition.duration + 's', ...style }}
    >
      <motion.div
        style={{
          transition:
            variant == 'horizontal'
              ? transition.duration +
                `s, gap ${transition.duration! / 2}s ${transition.duration! - transition.duration! / 2}s`
              : transition.duration +
                `s, gap ${transition.duration! / 3}s ${transition.duration! - transition.duration! / 3}s`,
        }}
        transition={transition}
        className={styles.container}
      >
        <State
          style={{ transition: transition.duration + 's' }}
          className={styles.stateLayer}
          colorName={classNames({
            'on-surface': !isSelected,
            'on-secondary-container': isSelected,
          })}
          stateClassName={'state-ripple-group-[navigation-rail-item]'}
        />
        {icon && (
          <Icon
            icon={isSelected ? iconSelected : icon}
            className={styles.icon}
          />
        )}
        <AnimatePresence>
          {variant == 'horizontal' &&
            (() => {
              const initial = {
                width: 0,
                opacity: 0,
                transition: {
                  ...transition,
                },
              };
              const animate = {
                width: 'auto',
                opacity: 1,
                transition: {
                  ...transition,
                  opacity: {
                    duration: transition.duration! / 2,
                    delay: transition.duration! - transition.duration! / 2,
                  },
                },
              };
              return (
                <motion.span
                  initial={initial}
                  animate={animate}
                  exit={initial}
                  className={styles.label}
                >
                  {label}
                </motion.span>
              );
            })()}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {variant == 'vertical' &&
          (() => {
            const initial = {
              height: 0,
              opacity: 0,
              transition: {
                ...transition,
                opacity: {
                  duration: 0,
                },
              },
            };
            const animate = {
              height: 'auto',
              opacity: 1,
              transition: {
                ...transition,
                opacity: {
                  duration: transition.duration! / 3,
                  delay: transition.duration! - transition.duration! / 3,
                },
              },
            };
            return (
              <motion.span
                initial={animate}
                animate={animate}
                exit={initial}
                className={styles.label}
                transition={transition}
              >
                {label}
              </motion.span>
            );
          })()}
      </AnimatePresence>
    </ElementType>
  );
};
