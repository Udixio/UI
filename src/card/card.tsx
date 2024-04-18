import { StylesHelper } from '../utils';
import React, { FunctionComponent, ReactNode } from 'react';
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

  /**
   * Optional class name for the state layer in the button.
   */
  stateClassName?: string;

  /**
   * @deprecated This will be removed in future versions. Use `children` instead.
   */
  header?: React.ReactElement<CardHeaderProps>;

  /**
   * @deprecated This will be removed in future versions. Use `children` instead.
   */
  media?: React.ReactElement<CardMediaProps>;

  /**
   * @deprecated This will be removed in future versions. Use `children` instead.
   */
  content?: React.ReactElement<CardContentProps>;

  /**
   * @deprecated This will be removed in future versions. Use `children` instead.
   */
  actions?: React.ReactElement<CardActionProps>;

  responsiveBreakPoint?: number;

  isInteractive?: boolean;

  children?: ReactNode;
}

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Card: FunctionComponent<CardProps> = ({
  variant = 'outlined',
  header,
  media,
  content,
  actions,
  className,
  stateClassName,
  children,
  isInteractive,
  responsiveBreakPoint = 500,
}: CardProps) => {
  const containerClass = StylesHelper.classNames([
    className,
    'card @container relative group border border-outline-variant rounded-xl overflow-hidden',
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
  const stateLayerClass = StylesHelper.classNames([
    stateClassName,
    'state-layer',
    { 'state-on-surface': isInteractive },
  ]);

  if (header || media || content || actions)
    return (
      <article className={containerClass}>
        <div className={''}></div>
        <div className={'@[' + responsiveBreakPoint + 'px]:flex'}>
          {children}
          <div className={' flex-1'}>
            {header && header}
            {media && media}
          </div>
          <div
            className={
              'flex flex-col justify-around mb-4 @xl:items-end  flex-1'
            }
          >
            {content && content}
            {actions && actions}
          </div>
        </div>
      </article>
    );
  else
    return (
      <article className={containerClass}>
        <div className={stateLayerClass}>{children}</div>
      </article>
    );
};
