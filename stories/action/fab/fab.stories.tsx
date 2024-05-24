import type { Meta, StoryObj } from '@storybook/react';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Fab, FabProps } from '../../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Action/Fab',
  component: Fab,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: { fable: { disable: true } },
    icon: { fable: { disable: true } },
  },
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createFabStory = (
  size: 'small' | 'medium' | 'large',
  isExtended?: boolean,
  args?: Partial<FabProps>
) => {
  const fabStory: Story = (args: FabProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <Fab {...args} variant={'surface'} />
        <Fab {...args} variant={'primary'} />
        <Fab {...args} variant={'secondary'} />
        <Fab {...args} variant={'tertiary'} />
      </div>
    </div>
  );
  fabStory.args = {
    label: 'Fab',
    icon: faPlus,
    ...args,
    size,
    isExtended,
  };
  return fabStory;
};
export const smallFab = createFabStory('small');
export const fab = createFabStory('medium');
export const largeFab = createFabStory('large');
export const extendedFabs = createFabStory('large', true);
