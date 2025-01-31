import { ComponentProps } from '@utils/index';
import { TabProps } from '@components/navigation/tabs/tab';
import { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';

export type TabsVariant = 'primary' | 'secondary';
export type TabsBaseProps = {
  variant?: TabsVariant;
  onTabSelected?: (
    args: { index: number } & Pick<TabProps, 'label' | 'icon'> & {
        ref: RefObject<any>;
      }
  ) => void;
  children: ReactNode;
  selectedTab?: number | null;
  setSelectedTab?: Dispatch<SetStateAction<number | null>>;
  scrollable?: boolean;
};
export type TabsStates = {};
export type TabsElements = 'tabs';

export type TabsElementType = 'div';

export type TabsProps = ComponentProps<
  TabsBaseProps,
  TabsStates,
  TabsElements,
  TabsElementType
> &
  TabsBaseProps;
