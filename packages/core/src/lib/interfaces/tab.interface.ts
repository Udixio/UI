import { Icon } from '../icon';
import { TabsVariant } from './tabs.interface';

type Props = {
  label?: string;
  icon?: Icon;
  /** Injected by the parent Tabs. */
  variant?: TabsVariant;
  /** Controlled selected state, used when no parent drives the selection. */
  selected?: boolean;
  /** Injected by the parent Tabs: position of this tab in the list. */
  index?: number;
  /** Injected by the parent Tabs: index of the currently selected tab. */
  selectedTab?: number | null;
  /** Injected by the parent Tabs: identifier shared by every tab of the group. */
  tabsId?: string;
};

export type TabStates = {
  isSelected: boolean;
};

type Elements = ['tab', 'stateLayer', 'icon', 'label', 'content', 'underline'];

export interface TabInterface {
  type: 'button';
  props: Props;
  states: TabStates;
  elements: Elements;
}
