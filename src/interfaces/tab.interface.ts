export type TabBaseProps = {
  selected: boolean;
  variant?: TabsVariant;
  label?: string;
  icon?: IconDefinition;
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  tabsId?: string;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
        ref: RefObject<any>;
      }
  ) => void;
  index?: number;
  scrollable?: boolean;
};
export type TabStates = {
  isSelected: boolean;
};
export type TabElements =
  | 'tab'
  | 'stateLayer'
  | 'icon'
  | 'label'
  | 'content'
  | 'underline';

export type TabProps = MergeExclusive<
  ComponentProps<TabBaseProps, TabStates, TabElements, 'a'> & {
    href: string;
  },
  ComponentProps<TabBaseProps, TabStates, TabElements, 'button'> & {
    href?: never;
  }
> &
  TabBaseProps;
