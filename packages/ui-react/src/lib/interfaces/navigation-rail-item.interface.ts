import { ActionOrLink } from '../utils';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { Transition } from 'motion';
import { Icon } from '../icon';

export type NavProps = {
  selected?: boolean;
  variant?: 'vertical' | 'horizontal';
  label?: string;
  children?: string;
  icon: Icon;
  iconSelected: IconDefinition;
  selectedItem?: number | null;
  setSelectedItem?: Dispatch<SetStateAction<number | null>>;
  onItemSelected?: (
    args: { index: number } & Pick<NavProps, 'label' | 'icon'> & {
        ref: RefObject<any>;
      },
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
