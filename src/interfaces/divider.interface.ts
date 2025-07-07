import { ComponentProps } from '../utils';

export type DividerBaseProps = {
  orientation?: 'vertical' | 'horizontal';
};
export type DividerStates = {};
export type DividerElements = 'divider';
export type DividerElementType = 'hr';

export type DividerProps = DividerBaseProps &
  ComponentProps<
    DividerBaseProps,
    DividerStates,
    DividerElements,
    DividerElementType
  >;
