import type { Meta, StoryObj } from '@storybook/react';

import {
  faCircleUser,
  faHeart,
  faMagnifyingGlass,
  faMessage,
  faPlane,
} from '@fortawesome/free-solid-svg-icons';
import { Tabs, TabsProps, TabsVariant } from '../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createTabStory = (variant?: TabsVariant, args?: Partial<TabsProps>) => {
  const tabStory: Story = (args: TabsProps) => (
    <div className="w-full">
      <Tabs {...args} />
    </div>
  );
  tabStory.args = {
    variant: variant,
    tabs: [
      { label: 'Explorer' },
      { label: 'Favoris' },
      { label: 'Voyages' },
      { label: 'Messages' },
      { label: 'profil' },
    ],
    ...args,
  };
  return tabStory;
};

export const PrimaryLabelOnly = createTabStory(TabsVariant.Primary);
export const PrimaryIconAndLabel = createTabStory(TabsVariant.Primary, {
  tabs: [
    { label: 'Explorer', icon: faMagnifyingGlass },
    { label: 'Favoris', icon: faHeart },
    { label: 'Voyages', icon: faPlane },
    { label: 'Messages', icon: faMessage },
    { label: 'profil', icon: faCircleUser },
  ],
});
export const PrimaryIconOnly = createTabStory(TabsVariant.Primary, {
  tabs: [
    { icon: faMagnifyingGlass },
    { icon: faHeart },
    { icon: faPlane },
    { icon: faMessage },
    { icon: faCircleUser },
  ],
});

export const SecondaryLabelOnly = createTabStory(TabsVariant.Secondary);
export const SecondaryIconAndLabel = createTabStory(TabsVariant.Secondary, {
  tabs: [
    { label: 'Explorer', icon: faMagnifyingGlass },
    { label: 'Favoris', icon: faHeart },
    { label: 'Voyages', icon: faPlane },
    { label: 'Messages', icon: faMessage },
    { label: 'profil', icon: faCircleUser },
  ],
});
