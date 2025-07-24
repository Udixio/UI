import { ReactNode } from 'react';

type Props = {
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
  throttleDuration?: number;
};
type CustomScrollStates = {
  isDragging: boolean;
};

export interface CustomScrollInterface {
  type: 'div';
  props: Props;
  states: CustomScrollStates;
  elements: ['customScroll', 'track'];
}
