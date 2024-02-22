import type { FunctionComponent } from 'react';

import { StylingHelper } from '../utils';

export type ProgressIndicatorVariant =
  | 'linear-determinate'
  | 'linear-indeterminate'
  | 'circular-determinate'
  | 'circular-indeterminate';

export interface ProgressIndicatorProps {
  variant?: ProgressIndicatorVariant;

  /*
   * The minimum height of the line used to draw the linear indicator.
   */
  minHeight?: number;

  /*
   * The percentage of the progress completed.
   */
  value?: number;

  /*
   * The duration of the transition animation in milliseconds.
   */
  transitionDuration?: number;

  className?: string;
}

export const ProgressIndicator: FunctionComponent<ProgressIndicatorProps> = ({
  variant = 'linear-determinate',
  minHeight = 4,
  value = 0,
  transitionDuration = 1000,
  className,
}: ProgressIndicatorProps) => {
  // Computed values for percentages
  let completedPercentage = value;
  if (completedPercentage > 100) {
    completedPercentage = 100;
  }
  if (completedPercentage < 0) {
    completedPercentage = 0;
  }

  const progressIndicatorClass = StylingHelper.classNames([
    className,
    'progress-indicator relative flex w-full gap-1.5',
  ]);

  return (
    <div
      style={{ height: `${minHeight}px` }}
      className={progressIndicatorClass}
    >
      <div
        style={{
          width: `${completedPercentage}%`,
          transition: `width ${transitionDuration}ms ease-in-out`,
        }}
        className="h-full rounded-full bg-primary rounded-l-full"
      ></div>
      <div
        style={{
          transition: `width ${transitionDuration}ms ease-in-out`,
        }}
        className="h-full flex-1 rounded-full bg-primary-container"
      ></div>
      <div
        style={{ height: `${minHeight}px`, width: `${minHeight}px` }}
        className="absolute right-0 bg-primary rounded-full"
      ></div>
    </div>
  );
};
