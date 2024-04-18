import { StylesHelper } from '../utils';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

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

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  variant = 'linear-determinate',
  minHeight = 4,
  value = 0,
  transitionDuration = 1000,
  className,
}: ProgressIndicatorProps) => {
  let completedPercentage = value;
  if (completedPercentage > 100) {
    completedPercentage = 100;
  }
  if (completedPercentage < 0) {
    completedPercentage = 0;
  }

  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    if (completedPercentage >= 100) {
      const timeoutId = setTimeout(() => {
        setShouldHide(true);
      }, transitionDuration);
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      setShouldHide(false);
    }
  }, [completedPercentage, transitionDuration]);

  const progressIndicatorClass = StylesHelper.classNames([
    className,
    'progress-indicator relative flex w-full',
  ]);

  return (
    <div
      style={{ height: `${minHeight}px` }}
      className={progressIndicatorClass}
    >
      <div
        style={{
          height: shouldHide ? '0px' : `${minHeight}px`,
          width: `${completedPercentage}%`,
          transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? ', height 200ms 0.5s ease-in-out' : ''}`,
        }}
        className="h-full rounded-full bg-primary rounded-l-full"
      ></div>
      <div
        style={{
          height: shouldHide ? '0px' : `${minHeight}px`,
          transition: `width ${transitionDuration}ms ease-in-out ${completedPercentage == 100 ? ', height 200ms 0.5s ease-in-out' : ''}`,
        }}
        className="h-full flex-1 rounded-full bg-primary-container"
      ></div>
      <div
        style={{
          height: shouldHide ? '0px' : `${minHeight}px`,
          width: `${minHeight}px`,
          transition: `width ${transitionDuration}ms ease-in-out, height 200ms 0.5s ease-in-out`,
        }}
        className={classNames('absolute right-0 bg-primary rounded-full', {
          'ml-1.5': completedPercentage < 100,
        })}
      ></div>
    </div>
  );
};
