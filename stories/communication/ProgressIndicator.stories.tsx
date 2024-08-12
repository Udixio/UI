import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  ProgressIndicator,
  ProgressIndicatorProps,
  ProgressIndicatorVariant,
} from '../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Communication/ProgressIndicator',
  component: ProgressIndicator,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof ProgressIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Function to create ProgressIndicatorComponent stories
const createProgressIndicatorStory = (variant: ProgressIndicatorVariant) => {
  const ProgressIndicatorStory: Story = (args: ProgressIndicatorProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <ProgressIndicator {...args} />
      </div>
    </div>
  );
  ProgressIndicatorStory.args = {
    variant: variant,
    value: 50,
  };
  return ProgressIndicatorStory;
};

export const LinearDeterminate =
  createProgressIndicatorStory('linear-determinate');

LinearDeterminate.argTypes = {
  value: { control: { type: 'range', min: 0, max: 100 } },
};

export const CircularDeterminate = createProgressIndicatorStory(
  'circular-determinate'
);

CircularDeterminate.argTypes = {
  value: { control: { type: 'range', min: 0, max: 100 } },
};
