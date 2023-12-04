import type { Meta, StoryObj } from '@storybook/react';

import { Card, CardProps, CardVariant } from '../src';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
    title: 'Data Display/Card',
    component: Card,
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
    argTypes: {
        type: { table: { disable: true } },
        icon: { table: { disable: true } },
        disabled: { table: { disable: true } },
    },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createCardStory = (variant: CardVariant) => {
    const CardStory: Story = (args: CardProps) => (
        <div className="">
            <div className="flex m-4 gap-4 items-center">
                <Card {...args} disabled={false} />
                <Card {...args} disabled={true} />
            </div>
            <div className="flex m-4 gap-4 items-center">
                <Card {...args} disabled={false} icon={faPlus} />
                <Card {...args} disabled={true} icon={faPlus} />
            </div>
        </div>
    );
    CardStory.args = {
        // label: 'Label',
        variant: variant,
    };
    return CardStory;
};

