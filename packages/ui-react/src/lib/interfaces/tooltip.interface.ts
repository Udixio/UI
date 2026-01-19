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
    /** Supporting text for the tooltip. Optional when using `content` prop. */
    text?: string;
    /** Custom content slot that replaces title/text/buttons when provided */
    content?: ReactNode;
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
    /** Delay in milliseconds before showing the tooltip. Default: 400ms */
    openDelay?: number;
    /** Delay in milliseconds before hiding the tooltip. Default: 150ms */
    closeDelay?: number;
    /** Controlled mode: explicitly control whether the tooltip is open */
    isOpen?: boolean;
    /** Uncontrolled mode: default open state */
    defaultOpen?: boolean;
    /** Callback when the open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Custom ID for accessibility linking. Auto-generated if not provided. */
    id?: string;
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
  elements: [
    'toolTip',
    'container',
    'subHead',
    'supportingText',
    'actions',
    'content',
  ];
};
