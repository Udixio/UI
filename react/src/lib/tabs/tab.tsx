import React, { FunctionComponent, useEffect } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabsVariant } from './tabs';
import { StylingHelper } from '../utils';
import { Icon } from '../icon';

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

export const Tab: FunctionComponent<TabProps> = ({
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
}) => {
  const ElementType = href ? 'a' : 'button';

  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      if (contentRef.current) {
        const element = contentRef.current;
        const style = window.getComputedStyle(element);

        const paddingLeft = parseFloat(style.paddingLeft);
        const paddingRight = parseFloat(style.paddingRight);
        const width = element.clientWidth - paddingLeft - paddingRight;
        const left = element.offsetLeft;

        if (setUnderlineWidth && selected) {
          setUnderlineWidth({ width, left });
        }
      }
    }

    if (selected) {
      window.addEventListener('resize', handleResize);
      handleResize();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selected, setUnderlineWidth]);

  let linkProps: any = {};
  if (href) {
    linkProps.href = href;
    linkProps.title = title;
  }

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
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
    'bg-surface',
    {
      applyWhen: Boolean(icon && label) && variant === TabsVariant.Primary,
      styles: ['h-16'],
    },
    {
      applyWhen: !(Boolean(icon && label) && variant === TabsVariant.Primary),
      styles: ['h-12'],
    },
  ]);

  const getStateLayerClass = StylingHelper.classNames([
    'flex px-4 justify-center h-full',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        {
          'state-on-surface': !selected,
          'state-primary': selected,
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: ['state-on-surface'],
    },
  ]);
  const getContentClass = StylingHelper.classNames([
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
  const getIconClass = StylingHelper.classNames([
    'h-6 w-6 p-0.5 !box-border',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-primary': selected,
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-on-surface': selected,
        },
      ],
    },
  ]);

  const getLabelTextClass = StylingHelper.classNames([
    'text-title-small',
    {
      applyWhen: variant === TabsVariant.Primary,
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-primary': selected,
        },
      ],
    },
    {
      applyWhen: variant === TabsVariant.Secondary,
      styles: [
        {
          'text-on-surface-variant': !selected,
          'text-on-surface': selected,
        },
      ],
    },
  ]);

  return (
    <ElementType
      href={href}
      title={title}
      className={getTabClass}
      {...buttonProps}
      {...linkProps}
      ref={variant === TabsVariant.Secondary ? contentRef : null}
    >
      <span className={getStateLayerClass}>
        <span
          ref={variant === TabsVariant.Primary ? contentRef : null}
          className={getContentClass}
        >
          {icon && <Icon icon={icon} className={getIconClass} />}
          <span className={getLabelTextClass}>{label}</span>
        </span>
      </span>
    </ElementType>
  );
};
