import { classNames, defaultClassNames } from '../utils';
import {
  SliderBaseProps,
  SliderElements,
  SliderStates,
} from '../interfaces/slider.interface';

export const sliderStyle = defaultClassNames<
  SliderBaseProps & SliderStates,
  SliderElements
>({
  defaultClassName: ({ value, isChanging }) => ({
    slider: classNames([
      'relative w-full h-11 flex items-center rounded gap-x-1.5 cursor-pointer',
    ]),
    activeTrack: classNames([
      'h-4 relative transition-all duration-100 bg-primary overflow-hidden rounded-l-full ',
    ]),
    inactiveTrack: classNames([
      'h-4 relative transition-all duration-100 bg-primary-container rounded-r-full overflow-hidden',
    ]),
    handle: classNames([
      'transform transition-all duration-100 bg-primary h-full rounded-full ',
      { 'w-0.5': isChanging, 'w-1': !isChanging },
    ]),
    valueIndicator: classNames([
      'absolute select-none bg-inverse-surface text-inverse-on-surface py-3 px-4 text-label-large rounded-full bottom-[calc(100%+4px)] transform left-1/2 -translate-x-1/2',
    ]),
    dot: classNames([
      'h-1 w-1 absolute transform -translate-y-1/2 -translate-x-1/2 top-1/2 rounded-full',
    ]),
  }),
  default: 'slider',
});
