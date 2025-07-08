/**
 * Type for the different variants of the ProgressIndicator component.
 */
export type ProgressIndicatorVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

export interface ProgressIndicatorInterface {
  type: 'div';
  props: {
    /**
     * The percentage of the progress completed.
     */
    value?: number;

    /**
     * The duration of the transition animation in milliseconds.
     */
    transitionDuration?: number;

    /**
     * The variant of the ProgressIndicator.
     */
    variant?: ProgressIndicatorVariant;
    /**
     * The minimum height of the line used to draw the linear indicator.
     */
    minHeight?: number;
  };
  states: { isVisible: boolean };

  elements: ['progressIndicator', 'stop', 'activeIndicator', 'track'];
}
