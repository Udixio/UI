import type { Meta, StoryObj } from '@storybook/react';

import {
  Button,
  ButtonVariant,
  Card,
  CardContent,
  CardProps,
  CardVariant,
  IconButton,
} from '../src';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { CardHeader } from '../src';
import { Avatar } from '../src/avatar';
import { CardAction } from '../src';
import { CardMedia } from '../src';

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
  argTypes: {},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

const createCardStory = (variant: CardVariant) => {
  const CardStory: Story = (args: CardProps) => (
    <div className="">
      <div className="lg:flex lg:m-4 lg:gap-4">
        <Card
          className={'flex-1'}
          {...args}
          header={
            <CardHeader
              avatar={<Avatar>T</Avatar>}
              title={'Title'}
              subTitle={'subtitle'}
            />
          }
          media={
            <CardMedia
              mediaType={'image'}
              mediaData={{
                src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                alt: 'alt',
              }}
            />
          }
          content={
            <CardContent title={'Title'} subTitle={'subtitle'}>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                Accusantium ex iusto laborum, magni maxime molestias nulla
                obcaecati, quae quis recusandae sed, veniam! Commodi consectetur
                magnam molestias tempora? Accusamus, iste tempore.
              </p>
            </CardContent>
          }
          actions={
            <CardAction>
              <Button label={'label'} />
              <IconButton arialLabel={'label'} icon={faPlus} />
            </CardAction>
          }
        />

        <div className={'flex-1'}>
          <Card
            className={''}
            {...args}
            media={
              <CardMedia
                mediaType={'image'}
                mediaData={{
                  src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
                  alt: 'alt',
                }}
              />
            }
            content={
              <CardContent
                title={"Glass Souls' World Tour"}
                subTitle={'From your recent favorites'}
              />
            }
            actions={
              <CardAction>
                <Button label={'Buy tickets'} />
              </CardAction>
            }
          />

          <Card
            {...args}
            content={
              <CardContent
                title={"Glass Souls' World Tour"}
                subTitle={'From your recent favorites'}
              />
            }
            actions={
              <CardAction>
                <Button label={'Buy tickets'} />
              </CardAction>
            }
          />
        </div>
      </div>

      <Card
        className={'flex-1'}
        {...args}
        media={
          <CardMedia
            mediaType={'image'}
            mediaData={{
              src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
              alt: 'alt',
            }}
          />
        }
        content={
          <CardContent>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium ex iusto laborum, magni maxime molestias nulla
              obcaecati, quae quis recusandae sed, veniam! Commodi consectetur
              magnam molestias tempora? Accusamus, iste tempore.
            </p>
          </CardContent>
        }
        actions={
          <CardAction>
            <Button label={'Get tickets'} />
            <Button variant={ButtonVariant.Outlined} label={'Learn more'} />
          </CardAction>
        }
      />
      <Card
        className={'flex-1'}
        {...args}
        header={
          <CardHeader
            avatar={<Avatar>T</Avatar>}
            title={'Title'}
            subTitle={'subtitle'}
          />
        }
        media={
          <CardMedia
            mediaType={'image'}
            mediaData={{
              src: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
              alt: 'alt',
            }}
          />
        }
        content={
          <CardContent title={'Title'} subTitle={'subtitle'}>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium ex iusto laborum, magni maxime molestias nulla
              obcaecati, quae quis recusandae sed, veniam! Commodi consectetur
              magnam molestias tempora? Accusamus, iste tempore.
            </p>
          </CardContent>
        }
        actions={
          <CardAction>
            <Button label={'Get tickets'} />
            <Button variant={ButtonVariant.Outlined} label={'Learn more'} />
          </CardAction>
        }
      />
    </div>
  );
  CardStory.args = {
    variant: variant,
  };
  return CardStory;
};
export const Outlined = createCardStory('outlined');
export const Elevated = createCardStory('elevated');
export const Filled = createCardStory('filled');
