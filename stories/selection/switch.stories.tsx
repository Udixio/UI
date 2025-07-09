import type { Meta, StoryObj } from '@storybook/react';
import { ReactProps, Switch, SwitchInterface, SwitchProps } from '../../src';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Selection/Switch',
  component: Switch,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createSwitchStory = (args?: Partial<ReactProps<SwitchInterface>>) => {
  const switchStory: Story = (args: SwitchProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <Switch {...args} />
        <Switch disabled {...args} />
      </div>
      <div className="flex m-4 gap-4 items-center">
        <Switch activeIcon={faCheck} inactiveIcon={faXmark} {...args} />
        <Switch
          activeIcon={faCheck}
          inactiveIcon={faXmark}
          disabled
          {...args}
        />
      </div>
    </div>
  );
  switchStory.args = {
    ...args,
  };
  return switchStory;
};
export const switchSelected = createSwitchStory({ selected: true });
export const switchUnselected = createSwitchStory({ selected: false });
