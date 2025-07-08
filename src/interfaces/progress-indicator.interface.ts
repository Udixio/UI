import { Component } from '../utils/component';

/**
 * Type for the different variants of the ProgressIndicator component.
 */
export type ProgressIndicatorVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

export type DividerInterface = Component<{
  type: 'div';
  props: {
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
  states: { isVisible: boolean };
  defaultProps: {
    orientation?: 'vertical' | 'horizontal';
  };
  elements: ['progressIndicator', 'stop', 'activeIndicator', 'track'];
}>;
