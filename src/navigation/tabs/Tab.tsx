import React, { forwardRef, useEffect, useMemo, useRef } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabsVariant } from './Tabs';
import { StyleProps, StylesHelper } from '../../utils';
import { Icon } from '../../icon';
import { tabStyle } from './TabStyle';
import RippleEffect from '../../effects/ripple/RippleEffect';
import { motion } from 'framer-motion';

export interface TabState {
  selected: boolean;
  variant: TabsVariant;
  label?: string;
  href?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset' | undefined;
  icon?: IconDefinition;
  selectedTab?: number | null;
  setSelectedTab?: React.Dispatch<React.SetStateAction<number | null>>;
  tabsId?: string;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'>
  ) => void;
  tabIndex?: number;
  scrollable?: boolean;
}

export type TabElement =
  | 'tab'
  | 'stateLayer'
  | 'icon'
  | 'label'
  | 'content'
  | 'underline';

export interface TabProps
  extends StyleProps<TabState, TabElement>,
    Partial<TabState> {}

export const Tab = forwardRef<HTMLButtonElement | HTMLAnchorElement, TabProps>(
  (args, ref) => {
    const {
      className,
      onClick,
      label,
      variant = 'primary',
      href,
      title,
      type,
      icon,
      setSelectedTab,
      selectedTab,
      tabsId,
      tabIndex,
      onTabSelected,
      ...restProps
    }: TabProps = args;

    const defaultRef = useRef();
    const resolvedRef = ref || defaultRef;

    const selected =
      useMemo(
        () =>
          (selectedTab === tabIndex && tabIndex != null) ||
          (!setSelectedTab && args.selected),
        [selectedTab]
      ) ?? false;

    useEffect(() => {
      if (setSelectedTab)
        if (args.selected && selectedTab == null) {
          setSelectedTab(tabIndex!);
        }
    }, [args.selected]);

    useEffect(() => {
      if (selectedTab == tabIndex && onTabSelected) {
        onTabSelected({
          index: tabIndex || 0,
          label,
          icon,
        });
      }
    }, [selectedTab]);

    const ElementType = href ? 'a' : 'button';

    let linkProps: any = {};
    if (href) {
      linkProps.href = href;
      linkProps.title = title;
    }

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (setSelectedTab) {
        setSelectedTab(tabIndex!);
      }
      if (onClick) {
        onClick(e);
      }
    };

    let buttonProps: any = {};
    if (!href) {
      buttonProps.type = type;
    }

    const getClassNames = (() => {
      return StylesHelper.classNamesElements<TabState, TabElement>({
        default: 'tab',
        classNameList: [className, tabStyle],
        states: {
          selected,
          variant,
          icon,
          href,
          title,
          label,
          onClick,
          type,
        },
      });
    })();
    return (
      <ElementType
        {...restProps}
        role="tab"
        aria-selected={selected}
        ref={resolvedRef}
        href={href}
        title={title}
        className={getClassNames.tab}
        onClick={handleClick}
        {...buttonProps}
        {...linkProps}
      >
        <span className={getClassNames.stateLayer}>
          <RippleEffect
            colorName={
              variant === 'primary' && selected ? 'primary' : 'on-surface'
            }
            triggerRef={resolvedRef}
          />
        </span>
        <span className={getClassNames.content}>
          {icon && <Icon icon={icon} className={getClassNames.icon} />}
          <span className={getClassNames.label}>{label}</span>
          {selected && (
            <motion.span
              layoutId={`underline-${tabsId}`}
              className={getClassNames.underline}
              transition={{ duration: 0.3 }}
            />
          )}
        </span>
      </ElementType>
    );
  }
);
