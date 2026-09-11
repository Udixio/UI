type Props = {
  /** Controlled index of the selected tab. */
  selectedTab?: number | null;
  /** Index selected on mount when the group is uncontrolled. */
  defaultSelectedTab?: number | null;
};

/**
 * TabGroup shares selection state between a tabs tablist and a tab panels
 * placed anywhere in its subtree.
 */
export interface TabGroupInterface {
  type: 'div';
  props: Props;
  states: object;
  elements: ['tabGroup'];
}
