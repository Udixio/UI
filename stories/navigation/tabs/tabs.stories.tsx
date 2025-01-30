import type { Meta, StoryObj } from '@storybook/react';

import {
  faCircleUser,
  faHeart,
  faMagnifyingGlass,
  faMessage,
  faPlane,
} from '@fortawesome/free-solid-svg-icons';
import { Tab, TabsComponent, TabsProps, TabsVariant } from '../../../src';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Navigation/Tabs',
  component: TabsComponent,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof TabsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createTabStory = (variant?: TabsVariant, args?: Partial<TabsProps>) => {
  const tabStory: Story = (args: TabsProps) => (
    <div className="w-full flex flex-col gap-8">
      <TabsComponent {...args} onTabSelected={(tab) => console.log(tab)}>
        {
          // @ts-ignore
          args.children.map((child) => child)
        }
      </TabsComponent>
      <TabsComponent
        scrollable
        {...args}
        onTabSelected={(tab) => console.log(tab)}
      >
        {
          // @ts-ignore
          args.children.map((child) => child)
        }
        {
          // @ts-ignore
          args.children.map((child) => child)
        }
      </TabsComponent>
    </div>
  );

  tabStory.args = {
    variant,
    children: [
      <Tab label={'Explorer'} selected></Tab>,
      <Tab label={'Favoris'}></Tab>,
      <Tab label={'Voyages'}></Tab>,
      <Tab label={'Messages'}></Tab>,
      <Tab label={'Profil'}></Tab>,
    ],
    ...args,
  };

  return tabStory;
};

export const PrimaryLabelOnly = createTabStory('primary');

export const PrimaryIconAndLabel = createTabStory('primary', {
  children: [
    <Tab label={'Explorer'} icon={faMagnifyingGlass} selected />,
    <Tab label={'Favoris'} icon={faHeart} />,
    <Tab label={'Voyages'} icon={faPlane} />,
    <Tab label={'Messages'} icon={faMessage} />,
    <Tab label={'Profil'} icon={faCircleUser} />,
  ],
});

export const PrimaryIconOnly = createTabStory('primary', {
  children: [
    <Tab icon={faMagnifyingGlass} selected />,
    <Tab icon={faHeart} />,
    <Tab icon={faPlane} />,
    <Tab icon={faMessage} />,
    <Tab icon={faCircleUser} />,
  ],
});

export const SecondaryLabelOnly = createTabStory('secondary');

export const SecondaryIconAndLabel = createTabStory('secondary', {
  children: [
    <Tab label={'Explorer'} icon={faMagnifyingGlass} selected />,
    <Tab label={'Favoris'} icon={faHeart} />,
    <Tab label={'Voyages'} icon={faPlane} />,
    <Tab label={'Messages'} icon={faMessage} />,
    <Tab label={'Profil'} icon={faCircleUser} />,
  ],
});
