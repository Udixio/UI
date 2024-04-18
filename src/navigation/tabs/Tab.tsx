import React, { forwardRef, useContext, useEffect, useMemo } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabContext, TabsVariant } from './Tabs';
import { StyleProps, StylesHelper } from '../../utils';
import { Icon } from '../../icon';
import { tabStyle } from './TabStyle';

export interface TabState {
  selected: boolean;
  variant: TabsVariant;
  label?: string;
  href?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  icon?: IconDefinition;
}

export type TabElement = 'tab' | 'stateLayer' | 'icon' | 'label' | 'content';

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
    }: TabProps = args;
    const { setSelectedTab, selectedTab } = useContext(TabContext);
    const selected = useMemo(() => selectedTab === ref, [selectedTab, ref]);

    useEffect(() => {
      if (args.selected && ref)
        if (setSelectedTab) {
          setSelectedTab(ref);
        }
    }, [args.selected, ref]);

    const ElementType = href ? 'a' : 'button';

    let linkProps: any = {};
    if (href) {
      linkProps.href = href;
      linkProps.title = title;
    }

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (setSelectedTab) {
        setSelectedTab(ref);
      }
      if (onClick) {
        onClick(e);
      }
    };

    let buttonProps: any = {};
    if (!href) {
      buttonProps.type = type;
      buttonProps.onClick = handleClick;
    }

    const getClassNames = (() => {
      return StylesHelper.classNamesElements<TabState, TabElement>({
        default: 'tab',
        classNameList: [className, tabStyle],
        states: { selected, variant, icon, href, title, label, onClick, type },
      });
    })();

    return (
      <ElementType
        role="tab"
        aria-selected={selected}
        ref={ref}
        href={href}
        title={title}
        className={getClassNames.tab}
        {...buttonProps}
        {...linkProps}
      >
        <span className={getClassNames.stateLayer}>
          <span className={getClassNames.content}>
            {icon && <Icon icon={icon} className={getClassNames.icon} />}
            <span className={getClassNames.label}>{label}</span>
          </span>
        </span>
      </ElementType>
    );
  }
);
