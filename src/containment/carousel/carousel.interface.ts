import { carouselStyle } from './CarouselStyle';
import { ComponentHelper, ComponentProps } from '../../utils';

type RequiredProps = {};
type OptionalProps = {
  variant:
    | 'hero'
    | 'center-aligned hero'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
};
type States = {};
type Elements = 'carousel';

export type CarouselProps = ComponentProps<
  RequiredProps,
  OptionalProps,
  States,
  Elements,
  HTMLDivElement
>;
export type CarouselClassName = CarouselProps['className'];

export const carouselHelper = new ComponentHelper<
  CarouselProps,
  OptionalProps,
  States,
  Elements
>('carousel');
{
}
carouselHelper.addStyle(carouselStyle);
