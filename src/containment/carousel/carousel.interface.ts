import { ComponentHelper } from '../../utils';
import { carouselStyle } from './CarouselStyle';

type RequiredProps = {};
type OptionalProps = {
  /**
   * Defines the layout and behavior of the carousel.
   * - `hero`: A prominent, large carousel for hero banners.
   * - `center-aligned hero`: Similar to `hero` but content is center-aligned.
   * - `multi-browse`: Allows browsing multiple items at once.
   * - `un-contained`: Spans outside the container boundaries.
   * - `full-screen`: Expands to fill the entire screen.
   */
  variant:
    | 'hero'
    | 'center-aligned hero'
    | 'multi-browse'
    | 'un-contained'
    | 'full-screen';
};
type States = {
  count: number;
};

export const carouselHelper = new ComponentHelper<
  RequiredProps,
  OptionalProps,
  States
>({ elements: ['carousel'] });
{
}
carouselHelper.setDefaultStyle(carouselStyle);

export type CarouselProps = (typeof carouselHelper)['propsType'];
export type CarouselClassName = (typeof carouselHelper)['classNameType'];
