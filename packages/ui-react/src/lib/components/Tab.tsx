import { motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import { Icon } from '../icon';
import { RippleEffect } from '../effects/ripple';
import { useTabStyle } from '../styles/tab.style';
import { TabInterface } from '../interfaces/tab.interface';
import { ReactProps } from '../utils/component';

/**
 * @status beta
 * @parent Tabs
 */
export const Tab = ({
  className,
  onClick,
  label,
  variant = 'primary',
  href,
  icon,
  selectedTab,
  setSelectedTab,
  tabsId,
  index,
  onTabSelected,
  scrollable = false,
  selected = false,
  ref,
  ...restProps
}: ReactProps<TabInterface>) => {
  const defaultRef = useRef(null);
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

  const styles = useTabStyle({
    className,
    onTabSelected,
    scrollable,
    selectedTab,
    index,
    tabsId,
    selected: isSelected,
    variant,
    icon,
    label,
    isSelected,
    setSelectedTab,
    href: href as any,
  });

  return (
    <ElementType
      {...restProps}
      role="tab"
      aria-selected={isSelected}
      ref={resolvedRef}
      href={href}
      className={styles.tab}
      onClick={handleClick}
      {...(restProps as any)}
    >
      <span className={styles.stateLayer}>
        <RippleEffect
          colorName={
            variant === 'primary' && isSelected ? 'primary' : 'on-surface'
          }
          triggerRef={resolvedRef}
        />
      </span>
      <span className={styles.content}>
        {icon && <Icon icon={icon} className={styles.icon} />}
        <span className={styles.label}>{label}</span>
        {isSelected && (
          <motion.span
            layoutId={`underline-${tabsId}`}
            className={styles.underline}
            transition={{ duration: 0.3 }}
          />
        )}
      </span>
    </ElementType>
  );
};
