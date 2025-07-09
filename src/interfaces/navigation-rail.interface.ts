import { TabProps } from './tab.interface';
import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';

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
    isExtended?: boolean;
    alignment?: 'middle' | 'top';
  };
  states: {};
  elements: ['navigationRail'];
}
