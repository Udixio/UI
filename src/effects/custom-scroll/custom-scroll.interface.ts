import { ReactNode } from 'react';
import { ComponentProps } from '../../utils';

export type CustomScrollBaseProps = {
  children: ReactNode;
  orientation?: 'vertical' | 'horizontal';
  scrollSize?: number;
  onScroll?: (args: {
    scroll: number;
    scrollProgress: number;
    scrollTotal: number;
    scrollVisible: number;
  }) => void;
  draggable?: boolean;
};
export type CustomScrollStates = {
  isDragging: boolean
};
export type CustomScrollElements = 'customScroll' | 'track';
export type CustomScrollElementType = 'div';

export type CustomScrollProps = CustomScrollBaseProps &
  Omit<
    ComponentProps<
      CustomScrollBaseProps,
      CustomScrollStates,
      CustomScrollElements,
      CustomScrollElementType
    >,
    'onScroll'
  >;
