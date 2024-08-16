import React from 'react';
import { StyleProps } from '../../utils';

/**
 * Type for the different variants of the ProgressIndicator component.
 */
export type ProgressIndicatorVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

/**
 * Interface for the internal state of the ProgressIndicator component.
 */
export interface ProgressIndicatorInternalState {
  isVisible: boolean;
}

/**
 * Interface for the default props of the ProgressIndicator component.
 */
export interface ProgressIndicatorDefaultProps {
  /**
   * The variant of the ProgressIndicator.
   */
  variant: ProgressIndicatorVariant;

  /**
   * The minimum height of the line used to draw the linear indicator.
   */
  minHeight: number;

  /**
   * The percentage of the progress completed.
   */
  value: number;

  /**
   * The duration of the transition animation in milliseconds.
   */
  transitionDuration: number;
}

/**
 * Interface for the external props of the ProgressIndicator component.
 */
export interface ProgressIndicatorExternalProps {}

/**
 * Type for the different elements of the ProgressIndicator component.
 */
export type ProgressIndicatorElement =
  | 'progressIndicator'
  | 'stop'
  | 'activeIndicator'
  | 'track';

/**
 * Type for the attributes of the ProgressIndicator component.
 * Omits 'className' and 'value' from the standard React InputHTMLAttributes.
 */
export type ProgressIndicatorAttributes = Omit<
  React.InputHTMLAttributes<HTMLDivElement>,
  'className' | 'value'
>;

/**
 * Interface for the props of the ProgressIndicator component.
 */
export interface ProgressIndicatorProps
  extends ProgressIndicatorExternalProps,
    Partial<ProgressIndicatorDefaultProps>,
    StyleProps<
      ProgressIndicatorExternalProps &
        ProgressIndicatorDefaultProps &
        ProgressIndicatorInternalState,
      ProgressIndicatorElement
    >,
    ProgressIndicatorAttributes {}
