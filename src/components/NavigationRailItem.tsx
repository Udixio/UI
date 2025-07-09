import React, { useEffect, useRef, useState } from 'react';

import { Icon } from '../icon';
import { ReactProps } from '../utils';
import { NavigationRailItemInterface } from '../interfaces';
import { navigationRailItemStyle } from '../styles/navigation-rail-item.style';

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
  iconSelected,
  ...restProps
}: ReactProps<NavigationRailItemInterface>) => {
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

  const styles = navigationRailItemStyle({
    className,
    onTabSelected,
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
    iconSelected,
  });

  return (
    <ElementType
      {...restProps}
      role="tab"
      aria-selected={isSelected}
      ref={resolvedRef}
      href={href}
      className={styles.navigationRailItem}
      onClick={handleClick}
      {...(restProps as any)}
    >
      <div className={styles.container}>
        <div className={styles.stateLayer}></div>
        {icon && (
          <Icon
            icon={isSelected ? iconSelected : icon}
            className={styles.icon}
          />
        )}
        {variant == 'horizontal' && (
          <span className={styles.label}>{label}</span>
        )}
      </div>
      {variant == 'vertical' && <span className={styles.label}>{label}</span>}
    </ElementType>
  );
};
