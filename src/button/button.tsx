import React, { MouseEventHandler } from 'react';
import { Icon } from '../icon';

import { StylesHelper } from '../utils';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export enum ButtonVariant {
  Filled = 'filled',
  Elevated = 'elevated',
  Outlined = 'outlined',
  Text = 'text',
  FilledTonal = 'tonal',
}

export interface ButtonProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The label is the text that is displayed on the button.
   */
  label: string;

  /**
   * The onClick function is called when the button is clicked.
   */
  onClick?: MouseEventHandler<HTMLElement> | undefined;

  /**
   * The button variant determines the style of the button.
   */
  variant?: ButtonVariant;

  /**
   * The 'type' of the button, defaults to 'button'. One of 'button', 'submit', 'reset', or undefined.
   */
  type?: 'button' | 'submit' | 'reset' | undefined;

  /**
   * If present, the button will be rendered as a link with this href.
   */
  href?: string;

  /**
   * If set to true and if href is provided, the link will be opened in a new tab.
   */
  external?: boolean;

  /**
   * The title is used as the tooltip text when the button is hovered.
   */
  title?: string;

  /**
   * Disables the button if set to true.
   */
  disabled?: boolean;

  /**
   * An optional icon to display in the button.
   */
  icon?: IconDefinition;

  /**
   * Optional class name for the button component.
   */
  className?: string;

  /**
   * Optional class name for the icon in the button.
   */
  iconClassName?: string;

  /**
   * Optional class name for the label in the button.
   */
  labelClassName?: string;

  /**
   * Optional class name for the state layer in the button.
   */
  stateClassName?: string;
}

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Button = ({
  variant = ButtonVariant.Filled,
  disabled,
  icon,
  href,
  title,
  label,
  onClick,
  type,
  external,
  className,
  iconClassName,
  labelClassName,
  stateClassName,
  ...restProps // Ici
}: ButtonProps) => {
  // Détermine le type de l'élément à rendre : un bouton ou un lien
  const ElementType = href ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  let linkProps: any = {};
  if (href) {
    linkProps.href = href;
    linkProps.title = title;
    if (external) {
      linkProps.target = '_blank';
    }
  }

  let buttonProps: any = {};
  if (!href) {
    buttonProps.type = type;
    buttonProps.onClick = handleClick;
  }

  const getButtonClass = StylesHelper.classNames([
    className,
    'button group rounded-full inline-block',
    {
      applyWhen: variant === ButtonVariant.Elevated,
      styles: [
        {
          'bg-surface-container-low': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Filled,
      styles: [
        {
          'bg-primary': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.FilledTonal,
      styles: [
        {
          'bg-secondary-container': !disabled,
        },
      ],
    },
  ]);

  const getStateLayerClass = StylesHelper.classNames([
    stateClassName,
    'state-layer flex gap-2 justify-center rounded-full  items-center px-6 py-2.5',
    {
      applyWhen: variant === ButtonVariant.Elevated,
      styles: [
        {
          'group-disabled:bg-on-surface/[0.12]': disabled,
          'state-primary shadow-1  group-hover:shadow-2': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Filled,
      styles: [
        {
          'group-disabled:bg-on-surface/[0.12]': disabled,
          'state-on-primary group-hover:shadow-1': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.FilledTonal,
      styles: [
        {
          'group-disabled:bg-on-surface/[0.12]': disabled,
          'state-on-secondary-container group-hover:shadow-1': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Outlined,
      styles: [
        ' border',
        {
          'group-disabled:border-on-surface/[0.12]': disabled,
          'state-primary border-outline state-primary group-focus:border-primary':
            !disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Text,
      styles: [
        {
          'state-primary': !disabled,
        },
      ],
    },
  ]);
  const getIconClass = StylesHelper.classNames([
    iconClassName,
    'icon h-[18px] w-[18px]',
    {
      applyWhen: variant === ButtonVariant.Elevated,
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Filled,
      styles: [
        {
          'text-on-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.FilledTonal,
      styles: [
        {
          'text-on-secondary-container': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Outlined,
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Text,
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
  ]);
  const getLabelTextClass = StylesHelper.classNames([
    labelClassName,
    'label-text text-label-large',
    {
      applyWhen: variant === ButtonVariant.Elevated,
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Filled,
      styles: [
        {
          'text-on-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.FilledTonal,
      styles: [
        {
          'text-on-secondary-container': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Outlined,
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === ButtonVariant.Text,
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
  ]);

  return (
    <ElementType
      disabled={disabled}
      href={href}
      title={title}
      className={getButtonClass}
      {...buttonProps}
      {...linkProps}
      {...restProps}
    >
      <span className={getStateLayerClass}>
        {icon && <Icon icon={icon} className={getIconClass} />}
        <span className={getLabelTextClass}>{label}</span>
      </span>
    </ElementType>
  );
};
