import type { Meta, StoryObj } from '@storybook/react';
import { ReactProps, Slider, SliderInterface } from '../../src';

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

const createSliderStory = (args?: Partial<ReactProps<SliderInterface>>) => {
  const sliderStory: Story = (args: ReactProps<SliderInterface>) => (
    <div className="">
      <div className="flex flex-col m-4 gap-4 items-center">
        <Slider value={0} min={0} max={100} step={1} {...args} />
        <Slider value={50} min={0} max={100} step={1} {...args} />
        <Slider value={100} min={0} max={100} step={1} {...args} />
      </div>
    </div>
  );
  sliderStory.args = {
    ...args,
  };
  return sliderStory;
};
export const continuousSlider = createSliderStory({});
export const discreteSlider = createSliderStory({
  marks: [
    {
      value: 0,
      label: '0%',
    },
    {
      value: 10,
      label: '10%',
    },
    {
      value: 20,
      label: '20%',
    },
    {
      value: 30,
      label: '30%',
    },
    {
      value: 40,
      label: '40%',
    },
    {
      value: 50,
      label: '50%',
    },
    {
      value: 60,
      label: '60%',
    },
    {
      value: 70,
      label: '70%',
    },
    {
      value: 80,
      label: '80%',
    },
    {
      value: 90,
      label: '90%',
    },
    {
      value: 100,
      label: '100%',
    },
  ],
});
