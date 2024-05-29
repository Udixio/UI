import type { Meta, StoryObj } from '@storybook/react';

import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Slider, SliderProps } from '../../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Selection/Slider',
  component: Slider,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createSliderStory = (
  size: 'small' | 'medium' | 'large',
  isExtended?: boolean,
  args?: Partial<SliderProps>
) => {
  const sliderStory: Story = (args: SliderProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <Slider {...args} value={75} min={50} max={100} />
      </div>
    </div>
  );
  sliderStory.args = {
    label: 'Slider',
    icon: faPlus,
    ...args,
    size,
    isExtended,
  };
  return sliderStory;
};
export const smallSlider = createSliderStory('small');
export const slider = createSliderStory('medium');
export const largeSlider = createSliderStory('large');
export const extendedSliders = createSliderStory('large', true);
