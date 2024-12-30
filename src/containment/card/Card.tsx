import React, { forwardRef, ReactNode, useRef } from 'react';
import { StyleProps, StylesHelper } from '../../utils';
import { cardStyle } from './CardStyle';
import { RippleEffect } from '../../effects/ripple';

export type CardVariant = 'outlined' | 'elevated' | 'filled';

export interface CardState {
  variant: CardVariant;
  isInteractive?: boolean;
}

export type CardElement = 'card' | 'stateLayer';

export interface CardProps
  extends StyleProps<CardState, CardElement>,
    Partial<CardState>,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'outlined',
      className,
      children,
      isInteractive,
      ...rest
    }: CardProps,
    ref
  ) => {
    const getClassNames = (() => {
      return StylesHelper.classNamesElements<CardState, CardElement>({
        default: 'card',
        classNameList: [className, cardStyle],
        states: {
          variant,
          isInteractive,
        },
      });
    })();

    const defaultRef = useRef<HTMLDivElement>(null);
    const resolvedRef = ref || defaultRef;

    return (
      <div {...rest} ref={resolvedRef} className={getClassNames.card}>
        <div className={getClassNames.stateLayer}>
          {isInteractive && (
            <RippleEffect colorName={'on-surface'} triggerRef={resolvedRef} />
          )}
        </div>
        {children}
      </div>
    );
  }
);
