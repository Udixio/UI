import type { Meta, StoryObj } from '@storybook/react';
import { SmoothScroll } from '../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'effect/SmoothScroll',
  component: SmoothScroll,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof SmoothScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createSmoothScrollStory = (variant: SmoothScrollVariant) => {
  const SmoothScrollStory: Story = (args) => (
    <div>
      <SmoothScroll orientation={'horizontal'} transition={'5s'} {...args}>
        <div className={'flex'}>
          <div className={'w-52 h-52 bg-primary'} />
          <div className={'w-52 h-52 bg-secondary'} />
          <div className={'w-52 h-52 bg-tertiary'} />{' '}
          <div className={'w-52 h-52 bg-primary'} />
          <div className={'w-52 h-52 bg-secondary'} />
          <div className={'w-52 h-52 bg-tertiary'} />{' '}
          <div className={'w-52 h-52 bg-primary'} />
          <div className={'w-52 h-52 bg-secondary'} />
          <div className={'w-52 h-52 bg-tertiary'} />{' '}
          <div className={'w-52 h-52 bg-primary'} />
          <div className={'w-52 h-52 bg-secondary'} />
          <div className={'w-52 h-52 bg-tertiary'} />
        </div>
      </SmoothScroll>
    </div>
  );
  SmoothScrollStory.args = {};
  return SmoothScrollStory;
};
export const Outlined = createSmoothScrollStory('outlined');
export const Elevated = createSmoothScrollStory('elevated');
export const Filled = createSmoothScrollStory('filled');
