import { ActionOrLink } from '../utils';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { Transition } from 'motion';

export type NavProps = {
  selected?: boolean;
  variant?: 'vertical' | 'horizontal';
  label?: string;
  icon: IconDefinition;
  iconSelected: IconDefinition;
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  tabsId?: string;
  onTabSelected?: (
    args: { index: number } & Pick<NavProps, 'label' | 'icon'> & {
        ref: RefObject<any>;
      }
  ) => void;
  index?: number;
  transition?: Transition;
  extendedOnly?: boolean;
  isExtended?: boolean;
};

type Elements = [
  'navigationRailItem',
  'stateLayer',
  'icon',
  'label',
  'container',
];

export type NavigationRailItemInterface = ActionOrLink<NavProps> & {
  states: {
    isSelected: boolean;
  };
  elements: Elements;
};
