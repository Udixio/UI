export type TabsVariant = 'primary' | 'secondary';

type Props = {
  variant?: TabsVariant;
  /** Enables horizontal scrolling and auto-centering of the selected tab. */
  scrollable?: boolean;
  /** Controlled index of the selected tab. */
  selectedTab?: number | null;
};

export type TabsStates = {
  /** Resolved selected index (controlled prop, TabGroup context or internal state). */
  selectedIndex: number | null;
};

type Elements = ['tabs'];

export interface TabsInterface {
  type: 'div';
  props: Props;
  states: TabsStates;
  elements: Elements;
}
