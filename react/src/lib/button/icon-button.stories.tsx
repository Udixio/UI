import type { Meta, StoryObj } from '@storybook/react';

import { faAccessibleIcon as farGear } from '@fortawesome/free-brands-svg-icons';
import { faClipboard as fasGear } from '@fortawesome/free-solid-svg-icons';
import { IconButton, IconButtonProps, IconButtonVariant } from '../src';
// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Inputs/IconButton',
  component: IconButton,
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
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createIconButtonStory = (
  variant: IconButtonVariant,
  toggle?: boolean
) => {
  const IconButtonStory: Story = (args: IconButtonProps) => (
    <div className="">
      {!toggle && (
        <>
          <div className="flex m-4 gap-4 items-center">
            <IconButton {...args} onToggle={undefined} />
            <IconButton {...args} disabled onToggle={undefined} />
          </div>
        </>
      )}
      {toggle && (
        <>
          <div className="flex m-4 gap-4 items-center">
            <IconButton {...args} />
            <IconButton {...args} disabled />
          </div>
          <div className="flex m-4 gap-4 items-center">
            <IconButton {...args} activated />
            <IconButton {...args} disabled activated />
          </div>
        </>
      )}
    </div>
  );

  if (toggle) {
    IconButtonStory.args = {
      variant: variant,
      arialLabel: 'Action description',
      onToggle: (isActive: boolean) => {},
      icon: farGear,
      iconSelected: fasGear,
    };
  } else {
    IconButtonStory.args = {
      variant: variant,
      arialLabel: 'Action description',
      icon: farGear,
    };
  }

  return IconButtonStory;
};
export const Standard = createIconButtonStory(IconButtonVariant.STANDARD);
export const Filled = createIconButtonStory(IconButtonVariant.FILLED);

export const Tonal = createIconButtonStory(IconButtonVariant.TONAl);

export const Outlined = createIconButtonStory(IconButtonVariant.OUTLINED);
export const StandardToggleable = createIconButtonStory(
  IconButtonVariant.STANDARD,
  true
);
export const FilledToggleable = createIconButtonStory(
  IconButtonVariant.FILLED,
  true
);

export const TonalToggleable = createIconButtonStory(
  IconButtonVariant.TONAl,
  true
);

export const OutlinedToggleable = createIconButtonStory(
  IconButtonVariant.OUTLINED,
  true
);
