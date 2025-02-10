import { ReactNode } from 'react';
import { MotionComponentProps } from '../../../../utils';

export type ItemBaseProps = {
  children?: ReactNode | undefined;
  width?: number;
  index?: number;
};
export type ItemStates = {};

export type ItemElements = 'item';
export type ItemElementType = 'div';

export type ItemProps = ItemBaseProps &
  MotionComponentProps<
    ItemBaseProps,
    ItemStates,
    ItemElements,
    ItemElementType
  >;
