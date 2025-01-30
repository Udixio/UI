import {
  DiviserBaseProps,
  DiviserElements,
  DiviserStates,
} from './diviser.interface';
import { classNames } from '@utils/styles/classnames';
import { defaultClassNames } from '@utils/styles/get-classname';

export const diviserStyle = defaultClassNames<
  DiviserBaseProps & DiviserStates,
  DiviserElements
>({
  defaultClassName: ({ orientation }) => ({
    diviser: classNames(
      'border-outline-variant ',
      {
        'h-fit w-full border-t': orientation === 'horizontal',
      },
      {
        'h-auto self-stretch w-fit border-l': orientation === 'vertical',
      }
    ),
  }),
  default: 'diviser',
});
