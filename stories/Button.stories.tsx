import type { Meta, StoryObj } from '@storybook/react';

import { Button, ButtonProps, ButtonVariant } from '../src';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Inputs/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    type: { table: { disable: true } },
    icon: { table: { disable: true } },
    disabled: { table: { disable: true } },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createButtonStory = (variant: ButtonVariant) => {
  const ButtonStory: Story = (args: ButtonProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <Button {...args} disabled={false} />
        <Button {...args} disabled={true} />
      </div>
      <div className="flex m-4 gap-4 items-center">
        <Button {...args} disabled={false} icon={faPlus} />
        <Button {...args} disabled={true} icon={faPlus} />
      </div>
    </div>
  );
  ButtonStory.args = {
    label: 'Label',
    variant: variant,
  };
  return ButtonStory;
};
export const Filled = createButtonStory(ButtonVariant.Filled);
export const Outlined = createButtonStory(ButtonVariant.Outlined);
export const Text = createButtonStory(ButtonVariant.Text);
export const Elevated = createButtonStory(ButtonVariant.Elevated);
export const Tonal = createButtonStory(ButtonVariant.FilledTonal);
