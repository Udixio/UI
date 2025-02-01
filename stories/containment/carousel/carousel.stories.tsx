import type { Meta, StoryObj } from '@storybook/react';
import { CarouselComponent, CarouselItem, CarouselProps } from '../../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'containment/Carousel',
  component: CarouselComponent,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} satisfies Meta<typeof CarouselComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createCarouselStory = (args?: Partial<CarouselProps>) => {
  const carouselStory: Story = (args: CarouselProps) => (
    <div className="">
      <div className="flex m-4 gap-4 items-center">
        <CarouselComponent {...args}>
          {Array.from({ length: 59 }).map((_, index) => (
            <CarouselItem key={index}>
              <img
                className={'object-cover  h-full w-full'}
                alt={'illustration'}
                src={`images/example-${Math.floor(Math.random() * 9) + 1}.webp`}
              />
            </CarouselItem>
          ))}
        </CarouselComponent>
      </div>
    </div>
  );
  carouselStory.args = {
    ...args,
  };
  return carouselStory;
};
export const hero = createCarouselStory();
export const centerAlignedHero = createCarouselStory();
export const multiBrowse = createCarouselStory();
export const unContained = createCarouselStory();
export const fullScreen = createCarouselStory();
