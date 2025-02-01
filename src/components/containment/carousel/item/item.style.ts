import { defaultClassNames } from '@utils/styles/get-classname';
import { ItemBaseProps, ItemElements, ItemStates } from './item.interface';
import { classNames } from '@utils/styles/classnames';

export const itemStyle = defaultClassNames<
  ItemBaseProps & ItemStates,
  ItemElements
>({
  defaultClassName: ({}) => {
    return {
      item: classNames('rounded-[28px] overflow-hidden flex-none', 'max-w-md'),
    };
  },
  default: 'item',
});
