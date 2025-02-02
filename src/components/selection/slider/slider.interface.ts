import { ComponentProps } from '../../../utils';


export type SliderBaseProps = {
  value: number;
  min: number;
  max: number;
  isChanging: boolean;
  marks?: {
    value: number;
    label?: string;
  }[];
  step: number;
  name: string;
  onChange?: (value: number) => void;
  valueFormatter?: (value: number) => string | number;
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

export type SliderProps = Omit<
  ComponentProps<
    SliderBaseProps,
    SliderStates,
    SliderElements,
    SliderElementType
  >,
  'onChange'
> &
  SliderBaseProps;
