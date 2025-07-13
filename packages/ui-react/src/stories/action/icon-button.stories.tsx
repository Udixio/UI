import type { Meta, StoryObj } from '@storybook/react';

import { faClipboard as farGear } from '@fortawesome/free-regular-svg-icons';
import { faClipboard as fasGear } from '@fortawesome/free-solid-svg-icons';
import {
  IconButton,
  IconButtonInterface,
  IconButtonVariant,
  ReactProps,
} from '../../';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Action/IconButton',
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
  toggle?: boolean,
) => {
  const sizes: ReactProps<IconButtonInterface>['size'][] = [
    'xSmall',
    'small',
    'medium',
    'large',
    'xLarge',
  ];
  const IconButtonStory: Story = (args: ReactProps<IconButtonInterface>) => (
    <div className="">
      {!toggle &&
        sizes.map((size) => (
          <div className="flex m-4 gap-4 items-center">
            <IconButton {...args} size={size} onToggle={undefined} />
            <IconButton {...args} size={size} disabled onToggle={undefined} />
          </div>
        ))}
      {toggle &&
        sizes.map((size) => (
          <>
            <div className="flex m-4 gap-4 items-center">
              <IconButton {...args} size={size} />
              <IconButton {...args} size={size} disabled />
            </div>
            <div className="flex m-4 gap-4 items-center">
              <IconButton {...args} size={size} activated />
              <IconButton {...args} size={size} disabled activated />
            </div>
          </>
        ))}
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
export const Standard = createIconButtonStory('standard');
export const Filled = createIconButtonStory('filled');

export const Tonal = createIconButtonStory('tonal');

export const Outlined = createIconButtonStory('outlined');
export const StandardToggleable = createIconButtonStory('standard', true);
export const FilledToggleable = createIconButtonStory('filled', true);

export const TonalToggleable = createIconButtonStory('tonal', true);

export const OutlinedToggleable = createIconButtonStory('outlined', true);
