export interface TabPanelsInterface {
  type: 'div';
  props: object;
  states: object;
  elements: ['tabPanels'];
}

export type TabPanelStates = {
  isSelected: boolean;
};

export interface TabPanelInterface {
  type: 'div';
  props: object;
  states: TabPanelStates;
  elements: ['tabPanel'];
}
