import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { SliderInterface } from '../interfaces';

export const sliderConfig: ClassNameComponent<SliderInterface> = ({
  isChanging,
}) => ({
  slider: cx([
    'relative w-full h-11 flex items-center rounded gap-x-1.5 cursor-pointer min-w-32',
  ]),
  activeTrack: cx([
    'h-4 relative transition-all duration-100 bg-primary overflow-hidden rounded-l-full ',
  ]),
  inactiveTrack: cx([
    'h-4 relative transition-all duration-100 bg-primary-container rounded-r-full overflow-hidden',
  ]),
  handle: cx([
    'transform relative transition-all duration-100 bg-primary h-full rounded-full ',
    { 'w-0.5': isChanging, 'w-1': !isChanging },
  ]),
  valueIndicator: cx([
    'absolute select-none bg-inverse-surface text-inverse-on-surface py-3 px-4 text-label-large rounded-full bottom-[calc(100%+4px)] transform left-1/2 -translate-x-1/2',
  ]),
  dot: cx([
    'h-1 w-1 absolute transform -translate-y-1/2 -translate-x-1/2 top-1/2 rounded-full',
  ]),
});

export const sliderStyle = defaultClassNames<SliderInterface>(
  'slider',
  sliderConfig,
);
