import React, {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react';

import { Icon } from '../icon';
import {
  type ReactProps,
  resolveTabSelection,
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
  /** Navigation destination; switches the inner element to a native link. */
  href?: string;
  /** Injected by the parent Tabs: this tab is the roving-tabindex stop while nothing is selected. */
  isFocusable?: boolean;
  /** Injected by the parent Tabs: whether a connected TabPanels exists (wires aria-controls). */
  hasPanels?: boolean;
  /** Injected by the parent Tabs: requests this tab becomes selected. */
  onTabSelect?: (index: number) => void;
  /** Injected by the parent Tabs: reports this tab's icon+label content element, which the sliding indicator measures for the `primary` variant. */
  contentRef?: (element: HTMLSpanElement | null) => void;
  onTabSelected?: (args: TabSelectedEvent) => void;
};

export const useTabStyle = createUseStyle(tabStyle);

/**
 * A single tab inside a `Tabs` tablist; renders as a link when `href` is
 * provided, otherwise as a button.
 * @status beta
 * @parent Tabs
 * @devx
 * - `label` can come from string children; selection is index-based and
 *   owned by the parent `Tabs` -- there is no standalone `selected` prop.
 * @a11y
 * - Exposes `id`, roving `tabIndex` (`0` on the selected or fallback tab,
 *   `-1` otherwise), and `aria-controls` pointing at the matching
 *   `TabPanel` when the tab list is connected to a `TabPanels`.
 * - `disabled` sets the native `disabled` attribute for a button tab, or
 *   `aria-disabled` and a blocked click for a link tab.
 * @limitations
 * - Horizontal layout only; there is no vertical tablist orientation.
 * - A truncated label has no built-in tooltip.
 */
export const Tab = ({
  className,
  onClick,
  label: labelProp,
  variant = 'primary',
  href,
  icon,
  disabled = false,
  selectedTab,
  isFocusable = false,
  hasPanels = false,
  tabsId,
  index,
  onTabSelect,
  contentRef,
  onTabSelected,
  children,
  ref,
  ...restProps
}: ReactTabProps) => {
  const defaultRef = useRef(null);
  const resolvedRef = ref || defaultRef;

  // children (string) peut être utilisé comme alternative à label prop
  const label =
    labelProp ?? (typeof children === 'string' ? children : undefined);

  const isSelected = resolveTabSelection({ selectedTab, index });

  useEffect(() => {
    if (isSelected && onTabSelected) {
      onTabSelected({
        ref: resolvedRef as any,
        index: index ?? 0,
        label,
        icon,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelected]);

  const ElementType = href ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent<any>) => {
    if (disabled) {
      if (href) e.preventDefault();
      return;
    }
    if (index != null) {
      onTabSelect?.(index);
    }
    onClick?.(e);
  };

  const styles = useTabStyle({
    label,
    icon,
    variant,
    disabled,
    index,
    selectedTab,
    tabsId,
    isSelected,
    className,
  });

  const domId =
    tabsId != null && index != null ? `tab-${tabsId}-${index}` : undefined;
  const panelId =
    hasPanels && tabsId != null && index != null
      ? `tabpanel-${tabsId}-${index}`
      : undefined;

  return (
    <ElementType
      role="tab"
      id={domId}
      aria-selected={isSelected}
      aria-controls={panelId}
      aria-disabled={href && disabled ? true : undefined}
      disabled={!href && disabled ? true : undefined}
      tabIndex={disabled ? -1 : isSelected || isFocusable ? 0 : -1}
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
      <span ref={contentRef} className={styles.content}>
        {icon && <Icon icon={icon} className={styles.icon} />}
        <span className={styles.label}>{label}</span>
      </span>
    </ElementType>
  );
};
