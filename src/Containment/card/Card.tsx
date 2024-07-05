import React, { ReactNode, useRef } from 'react';
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

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
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

    const defaultRef = useRef();
    const resolvedRef = ref || defaultRef;

    return (
      <div ref={resolvedRef} className={getClassNames.card} {...rest}>
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
