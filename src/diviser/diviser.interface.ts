import { ComponentProps } from '@utils/index';

export type DiviserBaseProps = {
  orientation?: 'vertical' | 'horizontal';
};
export type DiviserStates = {};
export type DiviserElements = 'diviser';
export type DiviserElementType = 'hr';

export type DiviserProps = DiviserBaseProps &
  ComponentProps<
    DiviserBaseProps,
    DiviserStates,
    DiviserElements,
    DiviserElementType
  >;
