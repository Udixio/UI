import { Component, Input } from '@angular/core';
import type { MouseEventHandler } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'tonal';

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

@Component({
  selector: 'u-button',
  templateUrl: './button.component.html',
  standalone: true,
})
export class ButtonComponent implements ButtonProps {
  @Input()
  label = 'Button';

  @Input()
  variant: ButtonVariant = 'filled';

  @Input()
  type: 'button' | 'submit' | 'reset' | undefined = 'button';

  @Input()
  disabled = false;
}
