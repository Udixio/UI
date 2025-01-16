import { ItemClassName } from './item.interface';
import { StylesHelper } from '../../../utils';

export const itemStyle: ItemClassName = ({ isExpanded }) => {
  return {
    item: StylesHelper.classNames([
      'rounded-[28px] overflow-hidden',
      ' flex-none',
    ]),
  };
};
