import type { Meta, StoryObj } from '@storybook/react';

import React from 'react';
import { Button, CodePreview, CodePreviewProps } from '../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Data Display/CodePreview',
  component: CodePreview,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof CodePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const code = `
  function Example() {
    const [count, setCount] = useState(0);
    return (
      <div>
        <p className="text-body-medium text-on-surface">You clicked {count} times</p>
        <Button label="Click me" onClick={() => setCount(count + 1)}/>
      </div>
    );
  }
`;

const createTabStory = (args?: Partial<CodePreviewProps>, render?: boolean) => {
  const tabStory: Story = (args: CodePreviewProps) => (
    <div className="">
      <div className="flex">
        <CodePreview {...args} />
      </div>
    </div>
  );
  tabStory.args = {
    ...args,
    code: code,
    renderPreview: render,
    scope: { Button },
  };
  return tabStory;
};

export const Standard = createTabStory();
export const Preview = createTabStory({}, true);
