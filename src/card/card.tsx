import { StylesHelper } from '../utils';
import React, { FunctionComponent, ReactNode } from 'react';

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

  isInteractive?: boolean;

  children?: ReactNode;
}

/**
 * The Button component is a versatile component that can be used to trigger actions or to navigate to different sections of the application
 */
export const Card: FunctionComponent<CardProps> = ({
  variant = 'outlined',
  className,
  stateClassName,
  children,
  isInteractive,
}: CardProps) => {
  const containerClass = StylesHelper.classNames([
    className,
    'card relative group border border-outline-variant rounded-xl overflow-hidden',
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
    'state-layer w-full h-full absolute -z-[1]',
    { 'group-state-on-surface': isInteractive },
  ]);

  return (
    <div className={containerClass}>
      <div className={stateLayerClass}></div>
      {children}
    </div>
  );
};
