import { ReactProps } from '../utils';
import { ButtonInterface } from './button.interface';

type Trigger = 'hover' | 'click' | 'focus' | null;

export interface ToolTipInterface {
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
  };
  elements: [
    'toolTip',
    'container',
    'content',
    'subHead',
    'supportingText',
    'actions',
  ];
}
