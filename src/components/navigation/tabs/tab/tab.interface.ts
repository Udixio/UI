import { ComponentProps } from '@utils/index';

import { Dispatch, RefObject, SetStateAction } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { MergeExclusive } from 'type-fest';
import { TabsVariant } from '@components/navigation/tabs';

export type TabBaseProps = {
  selected: boolean;
  variant: TabsVariant;
  label?: string | null;
  icon?: IconDefinition | null;
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>> | null;
  tabsId?: string | null;
  onTabSelected?:
    | ((
        args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
            ref: RefObject<any>;
          }
      ) => void)
    | null;
  index?: number | null;
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
