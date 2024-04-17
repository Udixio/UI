import React, { FunctionComponent, useContext, useEffect, useRef, forwardRef, useState } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabContext, TabsVariant } from './tabs';
import { StylingHelper } from '../../utils';
import { Icon } from '../../icon';

export interface TabProps {
  className?: string;
  selected?: boolean;
  label?: string;
  variant?: TabsVariant;
  href?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void | undefined;
  type?: 'button' | 'submit' | 'reset' | undefined;
  icon?: IconDefinition;
  setUnderlineWidth?: (measure: { width: number; left: number }) => void;
}

export const Tab = forwardRef<HTMLButtonElement, TabProps>(({
                                                              setUnderlineWidth,
                                                              className,
                                                              onClick,
                                                              selected,
                                                              label,
                                                              variant = TabsVariant.Primary,
                                                              href,
                                                              title,
                                                              type,
                                                              icon,
                                                            }, ref) => {

  const { setSelectedTab, selectedTab } = useContext(TabContext);
  const [isSelected, setIsSelected] = useState<boolean>(selected|| false);

  useEffect(() => {
    if(selected && ref)
      setSelectedTab(ref);
  }, [selected, ref]);

  useEffect(() => {
    if(ref)
      setIsSelected(selectedTab?.current == ref.current)
  }, [selectedTab]);

  const ElementType = href ? 'a' : 'button';


  let linkProps: any = {};
  if (href) {
    linkProps.href = href;
    linkProps.title = title;
  }

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setSelectedTab(ref);
    setIsSelected(true)
    if (onClick) {
      onClick(e);
    }
  };

  let buttonProps: any = {};
  if (!href) {
    buttonProps.type = type;
    buttonProps.onClick = handleClick;
  }

  const getTabClass = StylingHelper.classNames([
    className,
    'bg-surface flex-1',
    {
      applyWhen: Boolean(icon && label) && variant === TabsVariant.Primary,
      styles: ['h-16'],
    },
    {
      applyWhen: !(Boolean(icon && label) && variant === TabsVariant.Primary),
      styles: ['h-12'],
    },
  ]);

  const stateLayerClass = StylingHelper.classNames([
    'state-layer flex px-4 justify-center h-full',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        {
          'state-on-surface': !isSelected,
          'state-primary': isSelected,
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: ['state-on-surface'],
    },
  ]);
  const contentClass = StylingHelper.classNames([
    'content  h-full flex  gap-0.5 justify-end',
    {
      'pb-3.5': Boolean(label && !icon),
    },
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        'flex-col items-center',
        {
          'pb-2': Boolean(label && icon),
          'pb-3': Boolean(!label && icon),
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: [
        {
          'flex-col items-center': Boolean(!(label && icon)),
          'flex-row pb-3 items-end gap-2': Boolean(label && icon),
        },
      ],
    },
  ]);
  const iconClass = StylingHelper.classNames([
    'h-6 w-6 p-0.5 !box-border',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        {
          'text-on-surface-variant': !isSelected,
          'text-primary': isSelected,
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: [
        {
          'text-on-surface-variant': !isSelected,
          'text-on-surface': isSelected,
        },
      ],
    },
  ]);

  const labelTextClass = StylingHelper.classNames([
    'text-title-small',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        {
          'text-on-surface-variant': !isSelected,
          'text-primary': isSelected,
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: [
        {
          'text-on-surface-variant': !isSelected,
          'text-on-surface': isSelected,
        },
      ],
    },
  ]);

  return (
    <ElementType
      ref={ref}
      href={href}
      title={title}
      className={getTabClass}
      {...buttonProps}
      {...linkProps}
      // ref={variant === TabsVariant.Secondary ? contentRef : null}
    >
      <span className={stateLayerClass}>
        <span
          className={contentClass}
        >
          {icon && <Icon icon={icon} className={iconClass} />}
          <span className={labelTextClass}>{label}</span>
        </span>
      </span>
    </ElementType>
  );
});
