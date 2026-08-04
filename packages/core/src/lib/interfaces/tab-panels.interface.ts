export interface TabPanelsInterface {
  type: 'div';
  props: object;
  states: object;
  elements: ['tabPanels'];
}

type TabPanelProps = {
  /** Injected by the parent TabPanels: position of this panel in the list. */
  index?: number;
  /** Injected by the parent TabPanels: identifier shared by every tab and panel of the group. */
  tabsId?: string;
};

export interface TabPanelInterface {
  type: 'div';
  props: TabPanelProps;
  states: object;
  elements: ['tabPanel'];
}
