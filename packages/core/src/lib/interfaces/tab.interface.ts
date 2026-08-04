import { Icon } from '../icon';
import { TabsVariant } from './tabs.interface';

type Props = {
  /** Text shown for this tab; can also come from a string child. */
  label?: string;
  /** Icon shown alongside the label. */
  icon?: Icon;
  /** Disables pointer, keyboard, and roving-tabindex focus for this tab. */
  disabled?: boolean;
  /** Injected by the parent Tabs. */
  variant?: TabsVariant;
  /** Injected by the parent Tabs: position of this tab in the list. */
  index?: number;
  /** Injected by the parent Tabs: index of the currently selected tab. */
  selectedTab?: number | null;
  /** Injected by the parent Tabs: identifier shared by every tab and panel of the group. */
  tabsId?: string;
};

export type TabStates = {
  isSelected: boolean;
};

type Elements = ['tab', 'stateLayer', 'icon', 'label', 'content'];

export interface TabInterface {
  type: 'button';
  props: Props;
  states: TabStates;
  elements: Elements;
}
