import type { Meta, StoryObj } from '@storybook/react';
import { Diviser, DiviserProps } from '../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Data Display/Diviser',
  component: Diviser,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof Diviser>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createTabStory = (args?: Partial<DiviserProps>) => {
  const tabStory: Story = (args: DiviserProps) => (
    <div className="h-96 w-96 flex">
      <Diviser {...args} />
    </div>
  );
  tabStory.args = {
    ...args,
  };
  return tabStory;
};

export const Horizontal = createTabStory();
export const Vertical = createTabStory({ orientation: 'vertical' });
