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
  ),
  track: classNames('h-full rounded-full bg-primary rounded-l-full', {
    'max-h-0': !isVisible,
    'max-h-full': isVisible,
  }),
  activeIndicator: classNames(
    {
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
    (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
      'h-full flex-1 rounded-full bg-primary-container',

    (variant === 'circular-determinate' ||
      variant == 'circular-indeterminate') && [
      'stroke-primary fill-transparent ',
      {
        'stroke-[4px]': isVisible,
        'stroke-[0px]': !isVisible,
      },
    ],
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
