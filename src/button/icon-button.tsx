import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { Icon } from '../icon';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { StylingHelper } from '../utils';

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

export type IconButtonProps = {
  variant?: IconButtonVariant;
  disabled?: boolean;
  arialLabel: string;
  icon: IconDefinition;
  iconSelected?: IconDefinition;
  activated?: boolean;
  onToggle?: (isActive: boolean) => void;
  href?: string;
  target?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  iconClassName?: string;
};

export const IconButton: FunctionComponent<IconButtonProps> = ({
  variant = 'standard',
  href,
  disabled,
  type = 'button',
  title,
  arialLabel,
  onToggle,
  activated,
  onClick,
  icon,
  iconSelected,
  target,
  className,
  iconClassName,
}: IconButtonProps) => {
  const [isActive, setIsActive] = React.useState(activated);
  let handleClick:
    | ((event: React.MouseEvent<HTMLElement>) => void)
    | (() => void)
    | undefined;

  if (!onToggle) {
    handleClick = onClick;
  } else if (onToggle) {
    handleClick = () => {
      setIsActive(!isActive);
      onToggle(Boolean(isActive));
    };
    icon = isActive ? (iconSelected ? iconSelected : icon) : icon;
  }
  useEffect(() => {
    setIsActive(activated);
  }, [activated]);

  // Détermine le type de l'élément à rendre : un bouton ou un lien
  const ElementType = href ? 'a' : 'button';

  let linkProps: any = {};
  if (href) {
    linkProps.href = href;
    linkProps.target = target;
    linkProps.title = title;
  }

  let buttonProps: any = {};
  if (!href) {
    buttonProps.type = type;
    buttonProps.onClick = handleClick;
  }

  const getButtonClass = StylingHelper.classNames([
    'rounded-full overflow-hidden transition-all duration-300',
    className,
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'bg-surface-container': !isActive && Boolean(onToggle),
              'bg-primary': isActive || !onToggle,
            },
          ],
        },
        {
          applyWhen: Boolean(disabled),
          styles: ['bg-on-surface/[0.12]'],
        },
      ],
    },
    {
      applyWhen: variant === 'tonal',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'bg-surface-container': !isActive && Boolean(onToggle),
              'bg-secondary-container': isActive || !onToggle,
            },
          ],
        },
        {
          applyWhen: Boolean(disabled),
          styles: ['bg-on-surface/[0.12]'],
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'border border-outline': !isActive,
              'border border-transparent bg-inverse-surface': isActive,
            },
          ],
        },
        {
          applyWhen: Boolean(disabled),
          styles: [
            {
              'border border-on-surface/[0.12]': !isActive,
              'border border-transparent bg-on-surface/[0.12]': isActive,
            },
          ],
        },
      ],
    },
  ]);
  const getStateClass = StylingHelper.classNames([
    'p-2 flex rounded-full',
    {
      applyWhen: variant === 'standard',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'state-on-surface-variant': !isActive,
              'state-primary': isActive,
            },
          ],
        },
      ],
    },
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'state-primary': !isActive && Boolean(onToggle),
              'state-inverse-on-surface': isActive || !onToggle,
            },
          ],
        },
      ],
    },
    {
      applyWhen: variant === 'tonal',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'state-on-surface-variant': !isActive && Boolean(onToggle),
              'state-on-secondary-container': isActive || !onToggle,
            },
          ],
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'state-on-surface-variant': !isActive,
              'state-on-primary': isActive,
            },
          ],
        },
      ],
    },
  ]);
  const iconClass = StylingHelper.classNames([
    iconClassName,
    'h-5 p-0.5 w-5 transition-all duration-300',
    {
      applyWhen: variant === 'standard',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            { 'text-on-surface-variant': !isActive, 'text-primary': isActive },
          ],
        },
      ],
    },
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'text-primary': !isActive && Boolean(onToggle),
              'text-on-primary': isActive || !onToggle,
            },
          ],
        },
      ],
    },
    {
      applyWhen: variant === 'tonal',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'text-on-surface-variant': !isActive && Boolean(onToggle),
              'text-on-secondary-container': isActive || !onToggle,
            },
          ],
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        {
          applyWhen: !disabled,
          styles: [
            {
              'text-on-surface-variant': !isActive,
              'text-inverse-on-surface': isActive,
            },
          ],
        },
      ],
    },
    {
      applyWhen: Boolean(disabled),
      styles: ['text-on-surface/[0.38]'],
    },
  ]);
  return (
    <ElementType
      disabled={disabled}
      href={href}
      title={title}
      className={getButtonClass}
      aria-label={arialLabel}
      {...buttonProps}
      {...linkProps}
    >
      <span className={getStateClass}>
        {icon && <Icon icon={icon} className={iconClass} />}
      </span>
    </ElementType>
  );
};
