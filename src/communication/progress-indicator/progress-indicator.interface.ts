import React from 'react';
import { StyleProps } from '../../utils';

export type ProgressIndicatorVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

export interface ProgressIndicatorInternalState {
  isVisible: boolean;
}
export interface ProgressIndicatorDefaultProps {
  variant: ProgressIndicatorVariant;
  /*
   * The minimum height of the line used to draw the linear indicator.
   */
  minHeight: number;

  /*
   * The percentage of the progress completed.
   */
  value: number;

  /*
   * The duration of the transition animation in milliseconds.
   */
  transitionDuration: number;
}
export interface ProgressIndicatorExternalProps {}

export type ProgressIndicatorElement =
  | 'progressIndicator'
  | 'stop'
  | 'activeIndicator'
  | 'track';

export type ProgressIndicatorAttributes = Omit<
  React.InputHTMLAttributes<HTMLDivElement>,
  'className' | 'value'
>;

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
