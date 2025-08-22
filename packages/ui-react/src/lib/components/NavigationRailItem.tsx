import React, { useEffect, useRef, useState } from 'react';

import { Icon } from '../icon';
import { ReactProps } from '../utils';
import { NavigationRailItemInterface } from '../interfaces';
import { navigationRailItemStyle } from '../styles/navigation-rail-item.style';
import { AnimatePresence, motion } from 'motion/react';

/**
 * @status beta
 * @parent NavigationRail
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
}: ReactProps<NavigationRailItemInterface>) => {
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

  const styles = navigationRailItemStyle({
    isExtended,
    extendedOnly,
    className,
    onItemSelected,
    selectedItem,
    index,
    transition,
    selected: isSelected,
    variant,
    icon,
    label,
    isSelected,
    setSelectedItem,
    href: href as any,
    children: label,
    iconSelected,
  });

  transition = { duration: 0.3, ...transition };

  if (extendedOnly && !isExtended) return null;

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
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
