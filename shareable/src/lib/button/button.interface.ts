import type { MouseEventHandler } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ButtonVariant } from './button.style';

export interface IButton {
  label: string;
  onClick?: MouseEventHandler<HTMLElement> | undefined;
  variant: ButtonVariant;
  type?: 'button' | 'submit' | 'reset' | undefined;
  href?: string;
  title?: string;
  disabled?: boolean;
  icon?: IconDefinition;
  buttonClass?: string;
  stateClass?: string;
  iconClass?: string;
  labelClass?: string;
}
