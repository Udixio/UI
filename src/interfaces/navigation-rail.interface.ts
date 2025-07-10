import { TabProps } from './tab.interface';
import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type MenuState = {
  icon: IconDefinition;
  label: string;
};

export interface NavigationRailInterface {
  type: 'div';
  props: {
    variant?: 'standard' | 'modal';
    onTabSelected?: (
      args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
          ref: RefObject<any>;
        }
    ) => void;
    children: ReactNode;
    selectedTab?: number | null;
    setSelectedTab?: Dispatch<SetStateAction<number | null>>;
    extended?: boolean;
    alignment?: 'middle' | 'top';
    menu?: {
      closed: MenuState;
      opened: MenuState;
    };
  };
  states: { isExtended?: boolean };
  elements: ['navigationRail', 'header', 'menuIcon', 'segments'];
}
