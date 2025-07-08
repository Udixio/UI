import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { IconButtonVariant } from '../components/IconButton';
import { Component } from '../utils/component';

type Props = {
  arialLabel: string;
  icon: IconDefinition;
  iconSelected?: IconDefinition;
  onToggle?: (isActive: boolean) => void;
};

type DefaultProps = {
  variant: IconButtonVariant;
  disabled: boolean;
  activated: boolean;
};
export type IconButtonStates = {
  isActive: boolean;
};
type Elements = ['button', 'stateLayer', 'icon'];

export type IconButtonInterface =
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
