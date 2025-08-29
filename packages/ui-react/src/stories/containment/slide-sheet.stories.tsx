import type { Meta, StoryObj } from '@storybook/react';
import {
  MotionProps,
  ReactProps,
  SlideSheet,
  SlideSheetInterface,
} from '../../';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'containment/SlideSheet',
  component: SlideSheet,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof SlideSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createSlideSheetStory = (
  variant: ReactProps<SlideSheetInterface>['variant'],
) => {
  const SlideSheetStory: Story = (args: MotionProps<SlideSheetInterface>) => (
    <>
      <div
        className={
          'bg-surface-container-highest h-screen w-full flex justify-between'
        }
      >
        <SlideSheet position={'left'} {...args}></SlideSheet>
        <SlideSheet position={'right'} {...args}></SlideSheet>
      </div>
    </>
  );
  SlideSheetStory.args = {
    children: <div className={'h-96 w-96 bg-secondary-container'}></div>,
    variant: variant,
    title: 'SlideSheet',
  };
  return SlideSheetStory;
};
export const Standard = createSlideSheetStory('standard');
export const Modal = createSlideSheetStory('modal');
