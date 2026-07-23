import { ProgressIndicatorInterface } from '../interfaces/progress-indicator.interface';
import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';

const progressIndicatorConfig: ClassNameComponent<
  ProgressIndicatorInterface
> = ({ variant, isVisible }) => ({
  progressIndicator: cx(
    (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
      'flex w-full h-1',
    variant === 'linear-indeterminate' &&
      'relative overflow-hidden rounded-full',
  ),
  firstTrack: cx(
    (variant === 'linear-determinate' || variant === 'linear-indeterminate') &&
      'h-full rounded-full bg-primary-container',
    {
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
  ),
  activeIndicator: cx(
    'h-full rounded-full bg-primary',
    variant === 'linear-determinate' && {
      'rounded-l-full': true,
    },
    (variant === 'linear-indeterminate' ||
      variant === 'linear-determinate') && {
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
  lastTrack: cx(
    (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
      'h-full flex-1 rounded-full bg-primary-container',
    {
      'max-h-0': !isVisible,
      'max-h-full': isVisible,
    },
  ),
  stop: cx(
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
