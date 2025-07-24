import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  ButtonInterface,
  IconButtonInterface,
  ReactProps,
} from '../../';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Action/Button',
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

const createButtonStory = (variant: ReactProps<ButtonInterface>['variant']) => {
  const sizes: ReactProps<IconButtonInterface>['size'][] = [
    'xSmall',
    'small',
    'medium',
    'large',
    'xLarge',
  ];

  const ButtonStory: Story = (
    args: Pick<ReactProps<ButtonInterface>, 'label'>,
  ) => (
    <div className="">
      {sizes.map((size) => (
        <div className="flex m-4 gap-4 items-center justify-around">
          <Button {...args} size={size} disabled={false} />
          <Button {...args} size={size} shape={'squared'} disabled={false} />
          <Button {...args} size={size} disabled={true} />
          <Button {...args} size={size} shape={'squared'} disabled={true} />
        </div>
      ))}
      {sizes.map((size) => (
        <div className="flex m-4 gap-4 items-center justify-around">
          <Button {...args} icon={faPlus} size={size} disabled={false} />
          <Button
            {...args}
            icon={faPlus}
            size={size}
            shape={'squared'}
            disabled={false}
          />
          <Button {...args} icon={faPlus} size={size} disabled={true} />
          <Button
            {...args}
            icon={faPlus}
            size={size}
            shape={'squared'}
            disabled={true}
          />
        </div>
      ))}
    </div>
  );
  ButtonStory.args = {
    label: 'Label',
    variant: variant,
    onClick: () => console.log('click'),
  };
  return ButtonStory;
};
export const Filled = createButtonStory('filled');
export const Outlined = createButtonStory('outlined');
export const Text = createButtonStory('text');
export const Elevated = createButtonStory('elevated');
export const Tonal = createButtonStory('filledTonal');
