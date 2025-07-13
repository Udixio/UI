import type { Meta, StoryObj } from '@storybook/react';
import {
  NavigationRailItem,
  NavigationRailItemInterface,
  ReactProps,
} from '../../../';
import { faCircleUser as fasCircleUser } from '@fortawesome/free-solid-svg-icons';
import { faCircleUser as farCircleUser } from '@fortawesome/free-regular-svg-icons';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Navigation/Navigation rail item',
  component: NavigationRailItem,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: { table: { disable: true } },
    icon: { table: { disable: true } },
  },
} satisfies Meta<typeof NavigationRailItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createNavigationRailItemStory = (
  args?: Partial<ReactProps<NavigationRailItemInterface>>,
) => {
  const navigationRailItemStory: Story = (
    args: ReactProps<NavigationRailItemInterface>,
  ) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <NavigationRailItem {...args} />
        <NavigationRailItem {...args} selected />
      </div>
    </div>
  );
  navigationRailItemStory.args = {
    ...args,

    icon: farCircleUser,
    iconSelected: fasCircleUser,
  };
  return navigationRailItemStory;
};
export const VerticalIconAndLabel = createNavigationRailItemStory({
  variant: 'vertical',
  label: 'Label',
});
export const VerticalIconOnly = createNavigationRailItemStory({
  variant: 'vertical',
});
export const HorizontalIconAndLabel = createNavigationRailItemStory({
  variant: 'horizontal',
  label: 'Label',
});
export const HorizontalLabelOnly = createNavigationRailItemStory({
  variant: 'vertical',
});
