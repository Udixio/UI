import { ClassNameComponent, StylesHelper } from '../../utils';
import { SliderElement, SliderState } from './Slider';

export const SliderStyle: ClassNameComponent<SliderState, SliderElement> = ({
  value,
  isChanging,
}) => {
  return {
    slider: StylesHelper.classNames([
      'relative  w-full h-11 mt-10 flex items-center rounded gap-x-1.5 cursor-pointer',
    ]),
    activeTrack: StylesHelper.classNames([
      'h-4 relative transition-all duration-100 bg-primary overflow-hidden rounded-l-full ',
    ]),
    inactiveTrack: StylesHelper.classNames([
      'h-4 relative transition-all duration-100 bg-primary-container rounded-r-full overflow-hidden',
    ]),
    handle: StylesHelper.classNames([
      'transform transition-all duration-100 bg-primary h-full bg-blue-500 rounded-full ',
      { 'w-0.5': isChanging, 'w-1': !isChanging },
    ]),
    valueIndicator: StylesHelper.classNames([
      'absolute select-none bg-inverse-surface text-inverse-on-surface py-3 px-4 text-label-large rounded-full bottom-[calc(100%+4px)] transform left-1/2 -translate-x-1/2',
    ]),
    dot: StylesHelper.classNames([
      'h-1 w-1 absolute transform  -translate-y-1/2 -translate-x-1/2 top-1/2 rounded-full',
    ]),
  };
};
