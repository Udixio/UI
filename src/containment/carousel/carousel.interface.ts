import { carouselStyle } from './CarouselStyle';
import { ComponentHelper, ComponentProps } from '../../utils';
import { ReactNode } from 'react';

type RequiredProps = {
  children?: ReactNode;
  inputRange?: [number, number];
  outputRange?: [number, number];
};
type OptionalProps = {
  variant:
    | 'hero'
    | 'center-aligned hero'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
  marginPourcent: number;
  height?: string;
};
type States = {};
type Elements = 'carousel' | 'track';

export type CarouselProps = ComponentProps<
  RequiredProps,
  OptionalProps,
  States,
  Elements,
  'div'
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
