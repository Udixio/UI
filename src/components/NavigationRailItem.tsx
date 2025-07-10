import React, { useEffect, useRef, useState } from 'react';

import { Icon } from '../icon';
import { ReactProps } from '../utils';
import { NavigationRailItemInterface } from '../interfaces';
import { navigationRailItemStyle } from '../styles/navigation-rail-item.style';
import { AnimatePresence, motion } from 'motion/react';
import { v4 as uuidv4 } from 'uuid';

export const NavigationRailSection = ({ label }: { label: string }) => {
  return (
    <div className={' h-9 flex items-center mx-9 mt-3'}>
      <p className={'text-label-large text-on-surface-variant'}>{label}</p>
    </div>
  );
};

export const NavigationRailItem = ({
  className,
  onClick,
  label,
  variant = 'vertical',
  href,
  icon,
  selectedTab,
  setSelectedTab,
  tabsId,
  index,
  onTabSelected,
  selected = false,
  ref,
  transition,
  isExtended,
  iconSelected,
  style,
  extendedOnly,
  ...restProps
}: ReactProps<NavigationRailItemInterface>) => {
  const defaultRef = useRef<any>(null);
  const resolvedRef = ref || defaultRef;

  const [isSelected, setIsSelected] = useState<boolean>(selected);

  useEffect(() => {
    if (selected && selectedTab == null) {
      setIsSelected(true);
    } else {
      setIsSelected(selectedTab == index && index != null);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab == index && onTabSelected) {
      onTabSelected({
        ref: resolvedRef as any,
        index: index || 0,
        label,
        icon,
      });
    }
  }, [selectedTab]);

  const ElementType = href ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent<any>) => {
    if (setSelectedTab) {
      setSelectedTab(index ?? null);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const styles = navigationRailItemStyle({
    isExtended,
    extendedOnly,
    className,
    onTabSelected,
    selectedTab,
    index,
    tabsId,
    transition,
    selected: isSelected,
    variant,
    icon,
    label,
    isSelected,
    setSelectedTab,
    href: href as any,
    iconSelected,
  });

  const uuid = useRef(uuidv4());

  transition = { duration: 0.3, ...transition };

  if (extendedOnly && !isExtended) return null;

  return (
    // @ts-ignore
    <ElementType
      {...restProps}
      role="tab"
      aria-selected={isSelected}
      ref={resolvedRef}
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
        <motion.div layout className={styles.stateLayer}></motion.div>
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
                initial={initial}
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
