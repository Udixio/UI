import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { MergeExclusive } from 'type-fest';
import { IconButtonVariant } from '../components/IconButton';
import { ComponentProps } from '../utils';

export type IconButtonBaseProps = {
  variant?: IconButtonVariant;
  disabled?: boolean;
  arialLabel: string;
  icon: IconDefinition;
  iconSelected?: IconDefinition;
  activated?: boolean;
  onToggle?: (isActive: boolean) => void;
};
export type IconButtonStates = {
  isActive: boolean;
};

export type IconButtonElements = 'button' | 'stateLayer' | 'icon';

export type IconButtonProps = MergeExclusive<
  ComponentProps<
    IconButtonBaseProps,
    IconButtonStates,
    IconButtonElements,
    'a'
  > & {
    href: string;
  },
  ComponentProps<
    IconButtonBaseProps,
    IconButtonStates,
    IconButtonElements,
    'button'
  > & {
    href?: never;
  }
> &
  IconButtonBaseProps;
