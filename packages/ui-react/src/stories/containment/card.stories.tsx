import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardInterface, ReactProps } from '../../';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'containment/Card',
  component: Card,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createCardStory = (variant: ReactProps<CardInterface>['variant']) => {
  const CardStory: Story = (args: ReactProps<CardInterface>) => (
    <>
      <Card className={'w-[360px] h-[360px]'} {...args}></Card>
      <a className={'group'} href={'https://example.com/'} target={'_blank'}>
        <Card
          isInteractive={true}
          className={'w-[360px] h-[360px]'}
          {...args}
        ></Card>
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
