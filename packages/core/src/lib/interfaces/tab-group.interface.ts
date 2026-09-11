type Props = {
  /** Controlled index of the selected tab. */
  selectedTab?: number | null;
  /** Index selected on mount when the group is uncontrolled. */
  defaultSelectedTab?: number | null;
};

/**
 * Tab groups share one selection between a tab list and its panels.
 */
export interface TabGroupInterface {
  type: 'div';
  props: Props;
  states: object;
  elements: ['tabGroup'];
}
