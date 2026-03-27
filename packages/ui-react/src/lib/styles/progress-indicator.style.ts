import { ProgressIndicatorInterface } from '../interfaces/progress-indicator.interface';
import {
  type ClassNameComponent,
  classNames,
  createUseClassNames,
  defaultClassNames,
} from '../utils';

const progressIndicatorConfig: ClassNameComponent<
  ProgressIndicatorInterface
> = ({ variant, isVisible }) => ({
  progressIndicator: classNames(
    (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
      'flex w-full h-1',
    variant === 'linear-indeterminate' &&
      'relative overflow-hidden rounded-full',
  ),
  firstTrack: classNames(
    (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
      'h-full rounded-full bg-primary-container',
    {
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
  ),
  activeIndicator: classNames(
    'h-full rounded-full bg-primary',
    {
      'rounded-l-full': variant === 'linear-determinate',
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
    (variant === 'circular-determinate' ||
      variant == 'circular-indeterminate') && [
      'stroke-primary fill-transparent ',
      {
        'stroke-[4px]': isVisible,
        'stroke-[0px]': !isVisible,
      },
    ],
  ),
  lastTrack: classNames(
    (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
      'h-full flex-1 rounded-full bg-primary-container',
    {
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
  ),
  stop: classNames(
    'absolute top-1/2 -translate-y-1/2 right-0 bg-primary rounded-full size-1',
    {
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
  ),
});

export const progressIndicatorStyle =
  defaultClassNames<ProgressIndicatorInterface>(
    'progressIndicator',
    progressIndicatorConfig,
  );

export const useProgressIndicatorStyle =
  createUseClassNames<ProgressIndicatorInterface>(
    'progressIndicator',
    progressIndicatorConfig,
  );
