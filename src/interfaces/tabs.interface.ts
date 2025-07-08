import { Component } from '../utils/component';
import { TabProps } from './tab.interface';
import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';

export type TabsVariant = 'primary' | 'secondary';

export type TabsInterface = Component<{
  type: 'div';
  props: {
    variant?: TabsVariant;
    onTabSelected?: (
      args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
          ref: RefObject<any>;
        }
    ) => void;
    children: ReactNode;
    selectedTab?: number | null;
    setSelectedTab?: Dispatch<SetStateAction<number | null>>;
    scrollable?: boolean;
  };
  states: {};
  defaultProps: {};
  elements: ['tabs'];
}>;
