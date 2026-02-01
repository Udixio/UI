import { ReactNode } from 'react';

export interface TabPanelsInterface {
  type: 'div';
  props: {
    children: ReactNode;
  };
  states: object;
  elements: ['tabPanels'];
}

export interface TabPanelInterface {
  type: 'div';
  props: {
    children: ReactNode;
  };
  states: {
    isSelected: boolean;
  };
  elements: ['tabPanel'];
}
