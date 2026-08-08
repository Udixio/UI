import type { Icon } from '../icon';

export interface IconProps {
  /** Icon asset to render: a FontAwesome definition, an imported SVG image, or trusted raw SVG markup from `@udixio/icons-*`. */
  icon: Icon;
  /** Semantic color values applied to the rendered icon. One value themes a flat icon; two values theme a FontAwesome duotone icon's primary/secondary layers. */
  colors?: readonly string[];
}

export interface IconInterface {
  type: 'span';
  props: IconProps;
  states: object;
  elements: ['icon'];
}
