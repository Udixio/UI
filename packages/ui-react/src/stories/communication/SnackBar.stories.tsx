import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ReactProps, Snackbar, SnackbarInterface } from '../../';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Communication/Snackbar',
  component: Snackbar,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof Snackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Function to create Snackbar stories
const createSnackbarStory = (supportingText: string) => {
  const SnackbarStory: Story = (args: ReactProps<SnackbarInterface>) => (
    <Snackbar {...args} />
  );
  SnackbarStory.args = {
    supportingText: supportingText,
  };
  return SnackbarStory;
};

export const SingleLineSnackbar = createSnackbarStory('Single-line snackbar');
