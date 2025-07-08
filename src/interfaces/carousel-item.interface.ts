import { ReactNode } from 'react';

export interface ItemInterface {
  type: 'div';
  props: { children?: ReactNode | undefined };
  defaultProps: {
    width?: number;
    index?: number;
  };
  elements: ['item'];
}
