import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  TextField,
  TextFieldProps,
  TextFieldVariant,
} from '../../src/text-inputs/TextField';
import { v4 as uuidv4 } from 'uuid';
import {
  faCircleXmark,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Text Inputs/TextField',
  component: TextField,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

// Function to create TextField stories
const createTextFieldStory = (
  variant: TextFieldVariant,
  args?: Partial<TextFieldProps>
) => {
  const TextFieldStory: Story = (args: TextFieldProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <TextField name={'example' + uuidv4()} {...args} value="Input" />
        <TextField
          name={'example' + uuidv4()}
          {...args}
          value="Input"
          errorText="invalid value"
        />
        <TextField
          name={'example' + uuidv4()}
          {...args}
          value="Input"
          enabled={false}
        />
      </div>
      <div className="flex m-4 gap-4 items-center">
        <TextField name={'example' + uuidv4()} {...args} />
        <TextField
          name={'example' + uuidv4()}
          {...args}
          errorText="invalid value"
        />
        <TextField name={'example' + uuidv4()} {...args} enabled={false} />
      </div>
    </div>
  );
  TextFieldStory.args = {
    variant: variant,
    label: 'Label',
    placeholder: 'Placeholder',
    supportingText: 'Supporting text',
    ...args,
  };
  return TextFieldStory;
};

export const Filled = createTextFieldStory('filled');

export const FilledTrailingIcon = createTextFieldStory('filled', {
  trailingIcon: (
    <IconButton arialLabel="Action description" icon={faCircleXmark} />
  ),
});

export const FilledLealingIconAndTrailingIcon = createTextFieldStory('filled', {
  leadingIcon: faMagnifyingGlass,
  trailingIcon: (
    <IconButton arialLabel="Action description" icon={faCircleXmark} />
  ),
});

export const FilledLealingIcon = createTextFieldStory('filled', {
  leadingIcon: faMagnifyingGlass,
});

export const Outlined = createTextFieldStory('outlined');

export const OutlinedTrailingIcon = createTextFieldStory('outlined', {
  trailingIcon: (
    <IconButton arialLabel="Action description" icon={faCircleXmark} />
  ),
});

export const OutlinedLealingIconAndTrailingIcon = createTextFieldStory(
  'outlined',
  {
    leadingIcon: faMagnifyingGlass,
    trailingIcon: (
      <IconButton arialLabel="Action description" icon={faCircleXmark} />
    ),
  }
);

export const OutlinedLealingIcon = createTextFieldStory('outlined', {
  leadingIcon: faMagnifyingGlass,
});
