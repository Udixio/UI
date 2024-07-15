import React, { MouseEventHandler } from 'react';
import { Icon } from '../icon';

import { StylesHelper } from '../utils';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'filledTonal';

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

  iconPosition?: 'left' | 'right';
}

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Button = ({
  variant = 'filled',
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
  iconPosition = 'left',
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
    'button group relative outline-none py-2.5 overflow-hidden rounded-full inline-block flex gap-2 justify-center rounded-full  items-center  ',

    {
      applyWhen: variant === 'elevated',
      styles: [
        {
          'bg-surface-container-low  shadow-1 hover:shadow-2': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          'bg-primary hover:shadow-1': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filledTonal',
      styles: [
        {
          'bg-secondary-container hover:shadow-1': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        ' border',
        {
          'border-on-surface/[0.12]': disabled,
          ' border-outline focus:border-primary': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'text',
      styles: [
        '-my-2.5',
        { 'px-3': !icon },
        { 'pl-3 -ml-3 pr-4 -mr-4': icon && iconPosition == 'left' },
        { 'pl-4 -ml-4 pr-3 -mr-3': icon && iconPosition == 'right' },
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant !== 'text',
      styles: [
        { 'px-6': !icon },
        { 'pl-4 pr-6': icon && iconPosition == 'left' },
        { 'pl-6 pr-3': icon && iconPosition == 'right' },
      ],
    },
  ]);

  const getStateLayerClass = StylesHelper.classNames([
    stateClassName,
    'state-layer min-h-full min-w-full absolute top-0 left-0 ',
    {
      applyWhen: variant === 'elevated',
      styles: [
        {
          'group-disabled:bg-on-surface/[0.12]': disabled,
          'group-state-primary': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          'group-disabled:bg-on-surface/[0.12]': disabled,
          'group-state-on-primary': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filledTonal',
      styles: [
        {
          'group-disabled:bg-on-surface/[0.12]': disabled,
          'group-state-on-secondary-container ': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        {
          'group-state-primary  group-state-primary': !disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'text',
      styles: [
        {
          'group-state-primary': !disabled,
        },
      ],
    },
  ]);
  const getIconClass = StylesHelper.classNames([
    iconClassName,
    'icon h-[18px] w-[18px]',
    {
      applyWhen: variant === 'elevated',
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          'text-on-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filledTonal',
      styles: [
        {
          'text-on-secondary-container': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'text',
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
      applyWhen: variant === 'elevated',
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filled',
      styles: [
        {
          'text-on-primary': !disabled,
          'group-disabled:text-on-surface/[38%]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'filledTonal',
      styles: [
        {
          'text-on-secondary-container': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'outlined',
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
    {
      applyWhen: variant === 'text',
      styles: [
        {
          'text-primary': !disabled,
          'group-disabled:text-on-surface/[0.38]': disabled,
        },
      ],
    },
  ]);

  const iconElement = icon ? (
    <Icon icon={icon} className={getIconClass} />
  ) : (
    <></>
  );

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
      <span className={getStateLayerClass}></span>
      {iconPosition === 'left' && iconElement}
      <span className={getLabelTextClass}>{label}</span>
      {iconPosition === 'right' && iconElement}
    </ElementType>
  );
};
