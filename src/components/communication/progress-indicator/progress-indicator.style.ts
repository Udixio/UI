import {
  ProgressIndicatorBaseProps,
  ProgressIndicatorElements,
  ProgressIndicatorStates,
} from './progress-indicator.interface';
import { classNames, defaultClassNames } from '../../../utils';

export const progressIndicatorStyle = defaultClassNames<
  ProgressIndicatorBaseProps & ProgressIndicatorStates,
  ProgressIndicatorElements
>({
  defaultClassName: ({ variant, isVisible }) => ({
    progressIndicator: classNames(
      (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
        'flex w-full'
    ),
    track: 'h-full rounded-full bg-primary rounded-l-full',
    activeIndicator: classNames(
      (variant === 'linear-determinate' || variant == 'linear-indeterminate') &&
        'h-full flex-1 rounded-full bg-primary-container',

      (variant === 'circular-determinate' ||
        variant == 'circular-indeterminate') && [
        'stroke-primary fill-transparent ',
        {
          'stroke-[4px]': isVisible,
          'stroke-[0px]': !isVisible,
        },
      ]
    ),
    stop: 'absolute right-0 bg-primary rounded-full',
  }),
  default: 'progressIndicator',
});
