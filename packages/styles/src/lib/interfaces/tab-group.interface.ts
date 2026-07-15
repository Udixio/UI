import { Dispatch, ReactNode, SetStateAction } from 'react';

export interface TabGroupInterface {
  type: 'div';
  props: {
    children: ReactNode;
    selectedTab?: number | null;
    setSelectedTab?: Dispatch<SetStateAction<number | null>>;
    defaultTab?: number;
  };
  states: object;
  elements: ['tabGroup'];
}
