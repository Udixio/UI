import { StylingHelper } from '../utils';
import React, { FunctionComponent, ReactNode } from 'react';
import classNames from 'classnames';
import { CardMediaProps } from './CardMedia';
import { CardContentProps } from './CardContent';
import { CardHeaderProps } from './CardHeader';
import { CardActionProps } from './CardAction';

export type CardVariant = 'outlined' | 'elevated' | 'filled';

export interface CardProps {
  /**
   * The button variant determines the style of the Card.
   */
  variant: CardVariant;

  /**
   * Optional class name for the card component.
   */
  className?: string;

  header?: React.ReactElement<CardHeaderProps>;
  media?: React.ReactElement<CardMediaProps>;
  content?: React.ReactElement<CardContentProps>;
  actions?: React.ReactElement<CardActionProps>;

  responsiveBreakPoint?: number;
}

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Card: FunctionComponent<CardProps> = ({
  variant,
  header,
  media,
  content,
  actions,
  className,
  responsiveBreakPoint = 500,
}: CardProps) => {
  const containerClass = StylingHelper.classNames([
    className,
    '@container border border-outline-variant rounded-xl m-6 overflow-hidden',
    {
      applyWhen: variant === 'outlined',
      styles: 'bg-surface',
    },
    {
      applyWhen: variant === 'elevated',
      styles: 'bg-surface-container-low shadow-1',
    },
    {
      applyWhen: variant === 'filled',
      styles: 'bg-surface-container-highest',
    },
  ]);
  // const stateLayerClass = StylingHelper.classNames(["state-primary"])

  return (
    <article className={containerClass}>
      <div className={''}></div>
      <div className={'@[' + responsiveBreakPoint + 'px]:flex'}>
        <div className={' flex-1'}>
          {header && header}
          {media && media}
        </div>
        <div
          className={'flex flex-col justify-around mb-4 @xl:items-end  flex-1'}
        >
          {content && content}
          {actions && actions}
        </div>
      </div>
    </article>
  );
};
