import {
  ProgressIndicatorElement,
  ProgressIndicatorInternalState,
  ProgressIndicatorProps,
} from './progress-indicator.interface';
import { ClassNameComponent, StylesHelper } from '../../utils';

export const ProgressIndicatorStyle: ClassNameComponent<
  ProgressIndicatorProps & ProgressIndicatorInternalState,
  ProgressIndicatorElement
> = ({ variant, isVisible }) => {
  return {
    progressIndicator: StylesHelper.classNames([
      {
        applyWhen:
          variant === 'linear-determinate' || variant == 'linear-indeterminate',
        styles: 'flex w-full',
      },
    ]),
    track: 'h-full rounded-full bg-primary rounded-l-full',
    activeIndicator: StylesHelper.classNames([
      {
        applyWhen:
          variant === 'linear-determinate' || variant == 'linear-indeterminate',
        styles: 'h-full flex-1 rounded-full bg-primary-container',
      },
      {
        applyWhen:
          variant === 'circular-determinate' ||
          variant == 'circular-indeterminate',
        styles: [
          'stroke-primary fill-transparent ',
          {
            'stroke-[4px]': isVisible,
            'stroke-[0px]': !isVisible,
          },
        ],
      },
    ]),
    stop: 'absolute right-0 bg-primary rounded-full',
  };
};
