import {
  DividerBaseProps,
  DividerElements,
  DividerStates,
} from './divider.interface';
import { classNames } from '@utils/styles/classnames';
import { defaultClassNames } from '@utils/styles/get-classname';

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
