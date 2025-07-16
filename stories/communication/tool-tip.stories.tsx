import type { Meta, StoryObj } from '@storybook/react';
import { Button, ReactProps, ToolTip, ToolTipInterface } from '../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Communication/ToolTip',
  component: ToolTip,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof ToolTip>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createToolTipStory = (
  variant: ReactProps<ToolTipInterface>['variant']
) => {
  const ToolTipStory: Story = (args: ReactProps<ToolTipInterface>) => (
    <div className="h-96 relative">
      <div className="h-96 relative">
        <div className="absolute top-0 left-0">
          <ToolTip position="bottom-right" {...args}>
            <Button variant={'filledTonal'} label={'Bottom-right'}></Button>
          </ToolTip>
        </div>
        <div className="absolute top-0 left-0">
          <ToolTip position="bottom-right" {...args}>
            <Button variant={'filledTonal'} label={'Bottom-right'}></Button>
          </ToolTip>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <ToolTip position="bottom" {...args}>
            <Button variant={'filledTonal'} label={'Bottom-center'}></Button>
          </ToolTip>
        </div>

        <div className="absolute top-0 right-0">
          <ToolTip position="bottom-left" {...args}>
            <Button variant={'filledTonal'} label={'Bottom-left'}></Button>
          </ToolTip>
        </div>

        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <ToolTip position="right" {...args}>
            <Button variant={'filledTonal'} label={'Center-right'}></Button>
          </ToolTip>
        </div>

        <div className="absolute top-1/2 right-0 -translate-y-1/2">
          <ToolTip position="left" {...args}>
            <Button variant={'filledTonal'} label={'Center-left'}></Button>
          </ToolTip>
        </div>

        <div className="absolute bottom-0 left-0">
          <ToolTip position="top-right" {...args}>
            <Button variant={'filledTonal'} label={'Top-right'}></Button>
          </ToolTip>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <ToolTip position="top" {...args}>
            <Button variant={'filledTonal'} label={'Top-center'}></Button>
          </ToolTip>
        </div>

        <div className="absolute bottom-0 right-0">
          <ToolTip position="top-left" {...args}>
            <Button variant={'filledTonal'} label={'Top-left'}></Button>
          </ToolTip>
        </div>
      </div>
    </div>
  );
  ToolTipStory.args = {
    title: 'Title',
    text: 'Supporting line text lorem ipsum dolor sit amet, consectetur',
    buttons: [
      {
        label: 'Label',
        onClick: () => {},
      },
      {
        label: 'Label',
        onClick: () => {},
      },
    ],
  };
  return ToolTipStory;
};
export const Plain = createToolTipStory('plain');
export const Rich = createToolTipStory('rich');
