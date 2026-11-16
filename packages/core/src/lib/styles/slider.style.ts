import {
  type ClassNameComponent,
  cx,
  defaultClassNames,
} from '../utils';
import { SliderInterface } from '../interfaces';

export const sliderConfig: ClassNameComponent<SliderInterface> = ({
  isChanging,
  disabled,
}) => ({
  slider: cx([
    'relative w-full h-11 flex items-center rounded gap-x-1.5 cursor-pointer min-w-32',
    { 'pointer-events-none opacity-[0.38] cursor-default': disabled },
  ]),
  activeTrack: cx([
    'h-4 relative transition-[flex] duration-100 duration-[calc(100ms*var(--udx-motion-scale,1))] motion-reduce:transition-none [[data-udx-slider-motion-reduce]_&]:transition-none bg-primary overflow-hidden rounded-l-full ',
  ]),
  inactiveTrack: cx([
    'h-4 relative transition-[flex] duration-100 duration-[calc(100ms*var(--udx-motion-scale,1))] motion-reduce:transition-none [[data-udx-slider-motion-reduce]_&]:transition-none bg-primary-container rounded-r-full overflow-hidden',
  ]),
  handle: cx([
    'transform relative transition-[width] duration-100 duration-[calc(100ms*var(--udx-motion-scale,1))] motion-reduce:transition-none [[data-udx-slider-motion-reduce]_&]:transition-none bg-primary h-full rounded-full ',
    { 'w-0.5': isChanging, 'w-1': !isChanging },
  ]),
  // Shown/hidden by `createSliderIndicatorController` (core/dom) animating
  // the CSS `scale` property via `@udixio/motion`, not by a class here. The
  // static `-translate-x-1/2` centering lives on a separate, unanimated
  // wrapper around it. Keeping the animation itself in one shared controller
  // keeps it identical (one implementation) across all three adapters.
  // `pointer-events-none` always applies; this is a value tooltip, never a
  // click target.
  valueIndicator: cx([
    'select-none pointer-events-none bg-inverse-surface text-inverse-on-surface py-3 px-4 text-label-large rounded-full origin-bottom text-nowrap',
  ]),
  dot: cx([
    'h-1 w-1 absolute transform -translate-y-1/2 -translate-x-1/2 top-1/2 rounded-full',
  ]),
});

export const sliderStyle = defaultClassNames<SliderInterface>(
  'slider',
  sliderConfig,
);
