type Props = {
  /** Controlled index of the selected tab. */
  selectedTab?: number | null;
  /** Index selected on mount when the group is uncontrolled. */
  defaultTab?: number;
};

export interface TabGroupInterface {
  type: 'div';
  props: Props;
  states: object;
  elements: ['tabGroup'];
}
