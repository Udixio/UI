import { ComponentHelper, MotionComponentProps } from '../../../utils';
import { itemStyle } from './item.style';
import { ReactNode } from 'react';

type RequiredProps = {
  children?: ReactNode;
  visibilityPercentage: number;
  index?: number;
};
type OptionalProps = {};
type States = {};
type Elements = 'item';

export type ItemProps = MotionComponentProps<
  RequiredProps,
  OptionalProps,
  States,
  Elements,
  'div'
>;
export type ItemClassName = ItemProps['className'];

export const itemHelper = new ComponentHelper<
  ItemProps,
  OptionalProps,
  States,
  Elements
>('item');
{
}
itemHelper.addStyle(itemStyle);
