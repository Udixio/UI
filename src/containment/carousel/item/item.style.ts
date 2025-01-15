import { ItemClassName } from './item.interface';
import { StylesHelper } from '../../../utils';

export const itemStyle: ItemClassName = ({ isExpanded }) => {
  return {
    item: StylesHelper.classNames([
      'rounded-[28px] overflow-hidden transition-all duration-300',
      { ' flex-1 ': isExpanded, 'max-w-16 ': !isExpanded },
    ]),
  };
};
