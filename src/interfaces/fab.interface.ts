import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Component } from '../utils/component';

export type FabVariant = 'surface' | 'primary' | 'secondary' | 'tertiary';
type Props = {
  variant?: FabVariant;
  label?: string;
  icon: IconDefinition;
  size?: 'small' | 'medium' | 'large';
};
type DefaultProps = {
  isExtended: boolean;
};
export type States = {};

export type Elements = ['fab', 'stateLayer', 'icon', 'label'];

export type FabInterface =
  | Component<{
      type: 'a';
      props: Props & { href: string };
      states: {};
      defaultProps: DefaultProps;
      elements: Elements;
    }>
  | Component<{
      type: 'button';
      props: Props & { href?: never };
      states: {};
      defaultProps: DefaultProps;
      elements: Elements;
    }>;
