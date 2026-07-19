import type { ReactNode } from 'react';
import type { Transition } from 'motion';
import {
  buttonStyle,
  type ButtonInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import type { Icon } from '../icon';

export type ReactButtonProps = ReactProps<ButtonInterface> & {
  children?: ReactNode;
  icon?: Icon;
  iconPosition?: 'left' | 'right';
  href?: string;
  transition?: Transition;
};

export const useButtonStyle = createUseStyle(buttonStyle);
