import { DividerInterface } from '../interfaces/divider.interface';
import { classNames, defaultClassNames } from '../utils';

export const dividerStyle = defaultClassNames<DividerInterface>(
  'divider',
  ({ orientation }) => ({
    divider: classNames(
      'border-outline-variant ',
      {
        'h-fit w-full border-t': orientation === 'horizontal',
      },
      {
        'h-auto self-stretch w-fit border-l': orientation === 'vertical',
      }
    ),
  })
);
