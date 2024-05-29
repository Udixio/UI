import { ClassNameComponent, StylesHelper } from '../../utils';
import { SliderElement, SliderState } from './Slider';

export const SliderStyle: ClassNameComponent<SliderState, SliderElement> = ({
  value,
  isChanging,
}) => {
  return {
    slider: StylesHelper.classNames([
      'relative w-full h-11 mt-10 flex items-center rounded gap-x-1.5 cursor-pointer',
    ]),
    activeTrack: StylesHelper.classNames(['h-4 bg-primary  rounded-l-full ']),
    inactiveTrack: StylesHelper.classNames([
      'h-4 bg-primary-container rounded-r-full',
    ]),
    handle: StylesHelper.classNames([
      'transform bg-primary h-full bg-blue-500 rounded-full ',
      { 'w-0.5': isChanging, 'w-1': !isChanging },
    ]),
  };
};
