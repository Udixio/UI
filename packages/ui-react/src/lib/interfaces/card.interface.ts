import { ReactNode } from 'react';

export interface CardInterface {
  type: 'div';
  props: {
    variant?: 'outlined' | 'elevated' | 'filled';
    isInteractive?: boolean;
    children: ReactNode;
  };
  elements: ['card', 'stateLayer'];
}
