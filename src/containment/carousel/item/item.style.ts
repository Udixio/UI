import { ItemClassName } from './item.interface';
import { StylesHelper } from '../../../utils';

export const itemStyle: ItemClassName = ({ isExpanded }) => {
  return {
    item: StylesHelper.classNames([
      'rounded-[28px] overflow-hidden',
      'basis-1/4 flex-none',
      { '': isExpanded, 'min-w-16 flex-0': !isExpanded },
    ]),
  };
};
