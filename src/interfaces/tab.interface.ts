import { Component } from '../utils/component';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabsVariant } from './tabs.interface';
import { Dispatch, RefObject, SetStateAction } from 'react';

export type TabProps = {
  selected: boolean;
  variant?: TabsVariant;
  label?: string;
  icon?: IconDefinition;
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  tabsId?: string;
  onTabSelected?: (
    args: { index: number } & Pick<Props, 'label' | 'icon'> & {
        ref: RefObject<any>;
      }
  ) => void;
  index?: number;
  scrollable?: boolean;
};

type DefaultProps = {
  variant: 'filled' | 'elevated' | 'outlined' | 'text' | 'filledTonal';
  disabled: boolean;
  iconPosition: 'left' | 'right';
  loading: boolean;
};

type Elements = ['tab', 'stateLayer', 'icon', 'label', 'content', 'underline'];

export type TabInterface =
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
