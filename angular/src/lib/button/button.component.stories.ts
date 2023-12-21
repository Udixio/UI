import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  component: ButtonComponent,
  title: 'button',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<ButtonComponent>;

export const Filled: Story = {
  args: { label: 'Click me!', variant: 'filled' },
};
export const Outlined: Story = {
  args: { label: 'Click me!', variant: 'outlined' },
};
export const Text: Story = {
  args: { label: 'Click me!', variant: 'text' },
};
export const Elevated: Story = {
  args: { label: 'Click me!', variant: 'elevated' },
};
export const Tonal: Story = {
  args: { label: 'Click me!', variant: 'filledTonal' },
};

// export const Heading: Story = {
//   args: {},
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     expect(canvas.getByText(/button works!/gi)).toBeTruthy();
//   },
// };
