import { ReactProps } from '../utils';
import { ButtonInterface } from './button.interface';
import { ReactNode, RefObject } from 'react';
import { Transition } from 'motion';

type Trigger = 'hover' | 'click' | 'focus' | null;

export type ToolTipInterface<T extends HTMLElement = any> = {
  type: 'div';
  props: {
    variant?: 'plain' | 'rich';
    title?: string;
    text: string;
    buttons?: ReactProps<ButtonInterface> | ReactProps<ButtonInterface>[];
    position?:
      | 'top'
      | 'bottom'
      | 'left'
      | 'right'
      | 'top-left'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-right';
    trigger?: Trigger | Trigger[];
    transition?: Transition;
  } & (
    | {
        children?: never;
        targetRef: RefObject<T>;
      }
    | {
        children: ReactNode;
        targetRef?: never;
      }
  );
  elements: ['toolTip', 'container', 'subHead', 'supportingText', 'actions'];
};
