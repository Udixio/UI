import { ActionOrLink } from '../utils/component';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TabsVariant } from './tabs.interface';
import { Dispatch, RefObject, SetStateAction } from 'react';

export type TabProps = {
  selected?: boolean;
  variant?: TabsVariant;
  label?: string;
  icon?: IconDefinition;
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  tabsId?: string;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
        ref: RefObject<any>;
      }
  ) => void;
  index?: number;
  scrollable?: boolean;
};

type Elements = ['tab', 'stateLayer', 'icon', 'label', 'content', 'underline'];

export type TabInterface = ActionOrLink<TabProps> & {
  states: {
    isSelected: boolean;
  };
  elements: Elements;
};
