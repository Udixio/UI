import type { FunctionComponent, MouseEventHandler } from 'react';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Icon } from '../icon/icon';
import { ButtonStyle, ButtonVariant } from '@udixio/shareable';

export interface ButtonProps {
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
export const Button: FunctionComponent<ButtonProps> = ({
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
}: ButtonProps) => {
  // Détermine le type de l'élément à rendre : un bouton ou un lien
  const ElementType = href ? 'a' : 'button';

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  const linkProps: any = {};
  if (href) {
    linkProps.href = href;
    linkProps.title = title;
    if (external) {
      linkProps.target = '_blank';
    }
  }

  const buttonProps: any = {};
  if (!href) {
    buttonProps.type = type;
    buttonProps.onClick = handleClick;
  }

  const getButtonClass = () =>
    ButtonStyle.button({
      variant,
      disabled,
      buttonClass: className,
    });
  const getStateLayerClass = () =>
    ButtonStyle.state({
      variant,
      disabled,
      stateClass: stateClassName,
    });

  const getIconClass = () =>
    ButtonStyle.icon({
      variant,
      disabled,
      iconClass: iconClassName,
    });

  const getLabelTextClass = () =>
    ButtonStyle.label({
      variant,
      disabled,
      labelClass: labelClassName,
    });

  return (
    <ElementType
      disabled={disabled}
      href={href}
      title={title}
      className={getButtonClass}
      {...buttonProps}
      {...linkProps}
    >
      <span className={getStateLayerClass()}>
        {icon && <Icon icon={icon} className={getIconClass()} />}
        <span className={getLabelTextClass()}>{label}</span>
      </span>
    </ElementType>
  );
};
