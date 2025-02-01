import type { Meta, StoryObj } from '@storybook/react';
import { CardComponent, CardProps, CardVariant } from '../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'containment/Card',
  component: CardComponent,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof CardComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createCardStory = (variant: CardVariant) => {
  const CardStory: Story = (args: CardProps) => (
    <>
      <CardComponent
        className={'w-[360px] h-[360px]'}
        {...args}
      ></CardComponent>
      <a className={'group'} href={'https://example.com/'} target={'_blank'}>
        <CardComponent
          isInteractive={true}
          className={'w-[360px] h-[360px]'}
          {...args}
        ></CardComponent>
      </a>
    </>
  );
  CardStory.args = {
    variant: variant,
  };
  return CardStory;
};
export const Outlined = createCardStory('outlined');
export const Elevated = createCardStory('elevated');
export const Filled = createCardStory('filled');
