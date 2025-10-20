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
  // Controlled percentage (0..1). If provided, the container will reflect this progress.
  scroll?: number;
  // Callback fired with the latest scroll percentage (0..1) when user scrolls/drags.
  setScroll?: (progress: number) => void;
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
