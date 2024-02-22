import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
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

const createProgressIndicatorStory = (variant: ProgressIndicatorVariant) => {
  const ProgressIndicatorStory: Story = (args: ProgressIndicatorProps) => {
    // New component definition
    const WrapperComponent = () => {
      const [completed, setCompleted] = useState(0);

      useEffect(() => {
        const intervalId = setInterval(() => {
          const currentTime = new Date().getTime();
          const currentSecond = (currentTime / 1000) % 60;
          const progress = (currentSecond / 60) * 100;
          setCompleted(progress);
        }, 500);

        return () => {
          clearInterval(intervalId);
        };
      }, []);

      return <ProgressIndicator {...args} value={completed} />;
    };

    return (
      <div className="">
        <div className="flex m-4 gap-4 items-center">
          {/* Wrapped in a component */}
          <WrapperComponent />
        </div>
      </div>
    );
  };

  ProgressIndicatorStory.args = {
    variant: variant,
  };

  return ProgressIndicatorStory;
};

export const LinearDeterminate =
  createProgressIndicatorStory('linear-determinate');
