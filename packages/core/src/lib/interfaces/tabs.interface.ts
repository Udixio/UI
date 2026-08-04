export type TabsVariant = 'primary' | 'secondary';

type Props = {
  /** Visual style: `primary` (icon above label) or `secondary` (icon beside label). */
  variant?: TabsVariant;
  /** Enables horizontal scrolling and auto-centering of the selected tab. */
  scrollable?: boolean;
  /** Controlled index of the selected tab. */
  selectedTab?: number | null;
  /** Index selected on mount when the tab list is uncontrolled. */
  defaultSelectedTab?: number | null;
};

export type TabsStates = {
  /** Resolved selected index (controlled prop, TabGroup context, or uncontrolled state). */
  selectedIndex: number | null;
};

type Elements = ['tabs', 'indicator'];

export interface TabsInterface {
  type: 'div';
  props: Props;
  states: TabsStates;
  elements: Elements;
}
