import { DividerInterface } from '../interfaces';
import {
  type ClassNameComponent,
  classNames,
  defaultClassNames,
} from '../utils';

const dividerConfig: ClassNameComponent<DividerInterface> = ({
  orientation,
}) => ({
  divider: classNames(
    'border-outline-variant ',
    {
      'h-fit w-full border-t': orientation === 'horizontal',
    },
    {
      'h-auto self-stretch w-fit border-l': orientation === 'vertical',
    },
  ),
});

export const dividerStyle = defaultClassNames<DividerInterface>(
  'divider',
  dividerConfig,
);
