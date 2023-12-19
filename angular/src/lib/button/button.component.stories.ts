import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from './button.component';

const meta: Meta<ButtonComponent> = {
  component: ButtonComponent,
  title: 'button',
};
export default meta;
type Story = StoryObj<ButtonComponent>;

export const Primary: Story = {
  args: { label: 'Click me!' },
};

// export const Heading: Story = {
//   args: {},
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     expect(canvas.getByText(/button works!/gi)).toBeTruthy();
//   },
// };
