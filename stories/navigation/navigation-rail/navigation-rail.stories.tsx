import type { Meta, StoryObj } from '@storybook/react';

import { faCircleUser as fasCircleUser } from '@fortawesome/free-solid-svg-icons';
import {
  Fab,
  NavigationRail,
  NavigationRailItem,
  ReactProps,
} from '../../../src';
import { NavigationRailInterface } from '../../../src/interfaces/navigation-rail.interface';
import { faCircleUser as farCircleUser } from '@fortawesome/free-regular-svg-icons';

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  title: 'Navigation/Navigation rail',
  component: NavigationRail,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} satisfies Meta<typeof NavigationRail>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createStory = (args?: Partial<ReactProps<NavigationRailInterface>>) => {
  const story: Story = (
    args?: Partial<ReactProps<NavigationRailInterface>>
  ) => (
    <div className="w-full h-[90vh] flex flex-col gap-8">
      <NavigationRail {...args} onTabSelected={(tab: any) => console.log(tab)}>
        <Fab icon={farCircleUser} label={'Add Timer'} />
        <NavigationRailItem
          icon={farCircleUser}
          iconSelected={fasCircleUser}
          label={'Explorer'}
          selected
        ></NavigationRailItem>
        <NavigationRailItem
          icon={farCircleUser}
          iconSelected={fasCircleUser}
          label={'Favoris'}
        ></NavigationRailItem>
        <NavigationRailItem
          icon={farCircleUser}
          iconSelected={fasCircleUser}
          label={'Voyages'}
        ></NavigationRailItem>
        <NavigationRailItem
          icon={farCircleUser}
          iconSelected={fasCircleUser}
          label={'Messages'}
        ></NavigationRailItem>
        <NavigationRailItem
          icon={farCircleUser}
          iconSelected={fasCircleUser}
          label={'Profil'}
        ></NavigationRailItem>
      </NavigationRail>
    </div>
  );

  story.args = {
    ...(args as any),
  };

  return story;
};

export const PrimaryLabelOnly = createStory();

export const PrimaryIconAndLabel = createStory();

export const PrimaryIconOnly = createStory();

export const SecondaryLabelOnly = createStory();

export const SecondaryIconAndLabel = createStory();
