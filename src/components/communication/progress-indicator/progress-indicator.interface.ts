import { ComponentProps } from '@utils/index';

/**
 * Type for the different variants of the ProgressIndicator component.
 */
export type ProgressIndicatorVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

export type ProgressIndicatorBaseProps = {
  /**
   * The variant of the ProgressIndicator.
   */
  variant?: ProgressIndicatorVariant;

  /**
   * The minimum height of the line used to draw the linear indicator.
   */
  minHeight?: number;

  /**
   * The percentage of the progress completed.
   */
  value?: number;

  /**
   * The duration of the transition animation in milliseconds.
   */
  transitionDuration?: number;
};
export type ProgressIndicatorStates = {
  isVisible: boolean;
};
export type ProgressIndicatorElements =
  | 'progressIndicator'
  | 'stop'
  | 'activeIndicator'
  | 'track';
export type ProgressIndicatorElementType = 'div';

export type ProgressIndicatorProps = ProgressIndicatorBaseProps &
  ComponentProps<
    ProgressIndicatorBaseProps,
    ProgressIndicatorStates,
    ProgressIndicatorElements,
    ProgressIndicatorElementType
  >;
