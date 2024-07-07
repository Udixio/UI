import type { Meta, StoryObj } from '@storybook/react';

import { faHome } from '@fortawesome/free-solid-svg-icons';
import { Tab, TabProps, TabsVariant } from '../../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Navigation/Tab',
  component: Tab,
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
} satisfies Meta<typeof Tab>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createTabStory = (variant: TabsVariant, args?: Partial<TabProps>) => {
  const tabStory: Story = (args: TabProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <Tab {...args} />
        <Tab {...args} selected />
      </div>
    </div>
  );
  tabStory.args = {
    label: 'Tab',
    variant: variant,
    ...args,
  };
  return tabStory;
};
export const PrimaryIconAndLabel = createTabStory('primary', {
  icon: faHome,
});
export const PrimaryIconOnly = createTabStory('primary', {
  label: undefined,
  icon: faHome,
});
export const PrimaryLabelOnly = createTabStory('primary');
export const SecondaryLabelOnly = createTabStory('secondary');
export const SecondaryIconAndLabel = createTabStory('secondary', {
  icon: faHome,
});
