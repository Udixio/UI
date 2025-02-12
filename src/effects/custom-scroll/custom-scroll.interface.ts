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
};
export type CustomScrollStates = {};
export type CustomScrollElements = 'customScroll' | 'track';
export type CustomScrollElementType = 'div';

export type CustomScrollProps = CustomScrollBaseProps &
  ComponentProps<
    CustomScrollBaseProps,
    CustomScrollStates,
    CustomScrollElements,
    CustomScrollElementType
  >;
