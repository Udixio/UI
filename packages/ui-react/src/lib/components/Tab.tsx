import { motion } from 'motion/react';
import React, {
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Icon } from '../icon';
import {
  type ReactProps,
  type TabInterface,
  tabStyle,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import { State } from '../effects';

/** Payload emitted when a tab becomes the selected one. */
export type TabSelectedEvent = Pick<TabInterface['props'], 'label' | 'icon'> & {
  index: number;
  ref: RefObject<any>;
};

export type ReactTabProps = ReactProps<TabInterface> & {
  children?: ReactNode;
  href?: string;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  onTabSelected?: (args: TabSelectedEvent) => void;
};

export const useTabStyle = createUseStyle(tabStyle);

/**
 * @status beta
 * @parent Tabs
 * @devx
 * - `label` can come from string children; selection is index-based.
 * - Use `TabGroup` to sync selection with panels/animations.
 * @a11y
 * - No keyboard navigation or `aria-controls` wiring.
 */
export const Tab = ({
  className,
  onClick,
  label: labelProp,
  variant = 'primary',
  href,
  icon,
  selectedTab,
  setSelectedTab,
  tabsId,
  index,
  onTabSelected,
  selected = false,
  children,
  ref,
  ...restProps
}: ReactTabProps) => {
  const defaultRef = useRef(null);
  const resolvedRef = ref || defaultRef;

  // children (string) peut être utilisé comme alternative à label prop
  const label =
    labelProp ?? (typeof children === 'string' ? children : undefined);

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
    label,
    icon,
    variant,
    selected,
    index,
    selectedTab,
    tabsId,
    isSelected,
    className,
  });

  return (
    <ElementType
      role="tab"
      aria-selected={isSelected}
      ref={resolvedRef as any}
      href={href}
      className={styles.tab}
      onClick={handleClick}
      {...(restProps as any)}
    >
      <State
        style={{ transition: 0.3 + 's' }}
        className={styles.stateLayer}
        colorName={
          variant === 'primary' && isSelected ? 'primary' : 'on-surface'
        }
        stateClassName={'state-ripple-group-[tab]'}
      />
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
