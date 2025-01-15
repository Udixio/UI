import { ComponentHelper, ComponentProps } from '../../../utils';
import { itemStyle } from './item.style';

type RequiredProps = {};
type OptionalProps = {

};
type States = {};
type Elements = 'item';

export type ItemProps = ComponentProps<
  RequiredProps,
  OptionalProps,
  States,
  Elements,
  HTMLDivElement
>;
export type ItemClassName = ItemProps['className'];

export const carouselHelper = new ComponentHelper<
  ItemProps,
  OptionalProps,
  States,
  Elements
>('item');
{
}
carouselHelper.addStyle(itemStyle);
