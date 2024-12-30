import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { motion } from 'framer-motion';
import React, { forwardRef, useEffect, useRef, useState } from 'react';

import type { TabsVariant } from './Tabs';
import { tabStyle } from './TabStyle';
import { Icon } from '../../icon';
import { RippleEffect } from '../../effects/ripple';
import { StyleProps, StylesHelper } from '../../utils';

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
    args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
        ref: React.MutableRefObject<any>;
      }
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
      selectedTab,
      setSelectedTab,
      tabsId,
      tabIndex,
      onTabSelected,
      ...restProps
    }: TabProps = args;

    const defaultRef = useRef(null);
    const resolvedRef = ref || defaultRef;

    const [selected, setSelected] = useState(args.selected);

    useEffect(() => {
      if (args.selected && selectedTab == null) {
        setSelected(true);
      } else {
        setSelected(selectedTab == tabIndex && tabIndex != null);
      }
    }, [selectedTab]);

    useEffect(() => {
      if (selectedTab == tabIndex && onTabSelected) {
        onTabSelected({
          ref: resolvedRef as any,
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
          selected: selected ?? false,
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
