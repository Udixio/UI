import React, { forwardRef, useContext, useEffect, useMemo } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabContext, TabsVariant } from './Tabs';
import { StyleProps, StylesHelper } from '../../utils';
import { Icon } from '../../icon';
import { tabStyle } from './TabStyle';
import RippleEffect from '../../effects/ripple/RippleEffect';
import classnames from 'classnames';

export interface TabState {
  selected: boolean;
  variant: TabsVariant;
  label?: string;
  href?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset' | undefined;
  icon?: IconDefinition;
  stateVariant: 'fit' | 'full';
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
      stateVariant = 'full',
      variant = 'primary',
      href,
      title,
      type,
      icon,
      ...restProps
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
          stateVariant,
        },
      });
    })();

    return (
      <ElementType
        {...restProps}
        role="tab"
        aria-selected={selected}
        ref={ref}
        href={href}
        title={title}
        className={getClassNames.tab}
        onClick={handleClick}
        {...buttonProps}
        {...linkProps}
      >
        <span className={getClassNames.content}>
          <span
            className={classnames('flex', {
              relative: stateVariant == 'fit' && icon && variant == 'primary',
            })}
          >
            <span className={getClassNames.stateLayer}>
              <RippleEffect
                colorName={
                  variant === 'primary' && selected ? 'primary' : 'on-surface'
                }
                triggerRef={ref}
              />
            </span>
            {icon && <Icon icon={icon} className={getClassNames.icon} />}
          </span>
          <span className={getClassNames.label}>{label}</span>
        </span>
      </ElementType>
    );
  }
);
