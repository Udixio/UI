import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { MergeExclusive } from 'type-fest';
import { ComponentProps } from '../../../utils';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';
export type FabBaseProps = {
  variant?: FabVariant;
  label?: string;
  icon: IconDefinition;
  size?: 'small' | 'medium' | 'large';
  isExtended?: boolean;
};
export type FabStates = {};

export type FabElements = 'fab' | 'stateLayer' | 'icon' | 'label';

export type FabProps = MergeExclusive<
  ComponentProps<FabBaseProps, FabStates, FabElements, 'a'> & {
    href: string;
  },
  ComponentProps<FabBaseProps, FabStates, FabElements, 'button'> & {
    href?: never;
  }
> &
  FabBaseProps;
