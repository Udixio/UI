import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ComponentProps } from '@utils/index';
import { MergeExclusive } from 'type-fest';
import { IconButtonVariant } from '@components/action/icon-button/icon-button.component';

export type IconButtonBaseProps = {
  variant?: IconButtonVariant;
  disabled?: boolean;
  arialLabel: string;
  icon: IconDefinition;
  iconSelected?: IconDefinition | null;
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
