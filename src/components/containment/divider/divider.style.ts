import {
  DividerBaseProps,
  DividerElements,
  DividerStates,
} from './divider.interface';
import { classNames, defaultClassNames } from '../../../utils';

export const dividerStyle = defaultClassNames<
  DividerBaseProps & DividerStates,
  DividerElements
>({
  defaultClassName: ({ orientation }) => ({
    divider: classNames(
      'border-outline-variant ',
      {
        'h-fit w-full border-t': orientation === 'horizontal',
      },
      {
        'h-auto self-stretch w-fit border-l': orientation === 'vertical',
      }
    ),
  }),
  default: 'divider',
});
