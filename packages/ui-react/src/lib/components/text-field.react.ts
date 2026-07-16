import type { CSSProperties, ReactElement, ReactNode } from 'react';
import {
  textFieldStyle,
  type MenuItemInterface,
  type TextFieldInterface,
  type ReactProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';
import type { Icon } from '../icon';

export type ReactTextFieldProps = ReactProps<TextFieldInterface> & {
  children?: ReactNode;
  placeholder?: string;
  name?: string;
  label: string;
  supportingText?: string;
  trailingIcon?: ReactElement | Icon;
  leadingIcon?: ReactElement | Icon;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  showSupportingText?: boolean;
  defaultValue?: string;
  id?: string;
  style?: CSSProperties;
  options?: Array<
    {
      value: string | number;
      type?: 'divider' | 'headline';
    } & MenuItemInterface['props']
  >;
  type?: 'text' | 'password' | 'number' | 'date' | 'select';
  autoComplete?: 'on' | 'off' | string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

export const useTextFieldStyle = createUseStyle(textFieldStyle);
