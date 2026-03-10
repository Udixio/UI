import type { Meta, StoryObj } from '@storybook/react';
import { SmoothScroll } from '../../';
import { JSX } from 'react/jsx-runtime';

const meta = {
  title: 'effect/SmoothScroll',
  component: SmoothScroll,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    transition: {
      control: { type: 'text' },
      description: 'Duration of the scroll animation (e.g., "1s", "500ms", or number in seconds)',
    },
    orientation: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
    },
    smoothTouch: {
      control: { type: 'boolean' },
      description: 'Enable smooth scrolling on touch devices',
    },
    touchMultiplier: {
      control: { type: 'number' },
      description: 'Multiplier for touch scroll sensitivity',
    },
  },
} satisfies Meta<typeof SmoothScroll>;

export default meta;
type Story = StoryObj<typeof meta>;

const createSmoothScrollStory = () => {
  const SmoothScrollStory: () => JSX.Element = () => (
    <>
      <SmoothScroll transition="1s" />
      <div className="h-52 bg-primary" />
      <div className="h-52 bg-secondary" />
      <div className="h-52 bg-tertiary" />
      <div className="h-52 bg-primary" />
      <div className="h-52 bg-secondary" />
      <div className="h-52 bg-tertiary" />
      <div className="h-52 bg-primary" />
      <div className="h-52 bg-secondary" />
      <div className="h-52 bg-tertiary" />
      <div className="h-52 bg-primary" />
      <div className="h-52 bg-secondary" />
      <div className="h-52 bg-tertiary" />
    </>
  );

  return SmoothScrollStory;
};
export const SmoothScrollStory = createSmoothScrollStory();
