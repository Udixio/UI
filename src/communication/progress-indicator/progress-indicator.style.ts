import {
  ProgressIndicatorElement,
  ProgressIndicatorInternalState,
  ProgressIndicatorProps,
} from './progress-indicator.interface';
import { ClassNameComponent } from '../../utils';

export const ProgressIndicatorStyle: ClassNameComponent<
  ProgressIndicatorProps & ProgressIndicatorInternalState,
  ProgressIndicatorElement
> = ({}) => {
  return {
    progressIndicator: 'flex w-full',
    track: 'h-full rounded-full bg-primary rounded-l-full',
    activeIndicator: 'h-full flex-1 rounded-full bg-primary-container',
    stop: 'absolute right-0 bg-primary rounded-full',
  };
};
