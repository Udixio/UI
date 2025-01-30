import { ComponentProps } from '@utils/index';

export type SliderBaseProps = {
  value: number;
  min: number;
  max: number;
  isChanging: boolean;
  marks?: {
    value: number;
    label?: string;
  }[];
  step: number | null;
  name: string;
  valueFormatter?: ((value: number) => string | number) | null;
};
export type SliderStates = {};
export type SliderElements =
  | 'slider'
  | 'activeTrack'
  | 'handle'
  | 'inactiveTrack'
  | 'valueIndicator'
  | 'dot';

export type SliderElementType = 'div';

export type SliderProps = ComponentProps<
  SliderBaseProps,
  SliderStates,
  SliderElements,
  SliderElementType
> &
  SliderBaseProps;
