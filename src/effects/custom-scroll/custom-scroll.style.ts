import {
  CustomScrollBaseProps,
  CustomScrollElements,
  CustomScrollStates,
} from './custom-scroll.interface';
import { classNames, defaultClassNames } from '../../utils';

export const customScrollStyle = defaultClassNames<
  CustomScrollBaseProps & CustomScrollStates,
  CustomScrollElements
>({
  defaultClassName: ({ orientation, draggable, isDragging }) => ({
    customScroll: classNames('flex h-full w-full', {
      'overflow-y-scroll flex-col': orientation === 'vertical',
      'overflow-x-scroll  flex-row': orientation === 'horizontal',
      'cursor-grab': draggable && !isDragging,
      'cursor-grabbing': draggable && isDragging,
    }),
    track: classNames('overflow-hidden flex-none sticky', {
      'left-0 h-full': orientation === 'horizontal',
      'top-0 w-full': orientation === 'vertical',
    }),
  }),
  default: 'customScroll',
});
