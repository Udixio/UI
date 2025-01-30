import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import { Icon } from '../../../../icon';
import { RippleEffect } from '../../../../effects/ripple';
import { tabStyle } from '@components/navigation/tabs/tab/tab.style';
import { TabProps } from '@components/navigation/tabs/tab/tab.interface';

export const Tab = ({
  className,
  onClick,
  label = null,
  variant = 'primary',
  href,
  icon = null,
  selectedTab = null,
  setSelectedTab = null,
  tabsId = null,
  index = null,
  onTabSelected = null,
  scrollable = false,
  selected,
  ref,
  ...restProps
}: TabProps) => {
  const defaultRef = useRef(null);
  const resolvedRef = ref || defaultRef;

  const [isSelected, setIsSelected] = useState(selected);

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
      setSelectedTab(index);
    }
    if (onClick) {
      onClick(e);
    }
  };

  const styles = tabStyle({
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
  });

  return (
    <ElementType
      {...restProps}
      role="tab"
      aria-selected={selected}
      ref={resolvedRef}
      href={href}
      className={styles.tab}
      onClick={handleClick}
      {...(restProps as any)}
    >
      <span className={styles.stateLayer}>
        <RippleEffect
          colorName={
            variant === 'primary' && selected ? 'primary' : 'on-surface'
          }
          triggerRef={resolvedRef}
        />
      </span>
      <span className={styles.content}>
        {icon && <Icon icon={icon} className={styles.icon} />}
        <span className={styles.label}>{label}</span>
        {selected && (
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
