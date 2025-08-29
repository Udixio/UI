import { Transition } from 'motion';
import { Icon } from '../icon';

export interface SlideSheetInterface {
  type: 'div';
  props: {
    variant?: 'standard' | 'modal';
    children: React.ReactNode;
    title?: string;
    position?: 'left' | 'right';
    extended?: boolean;
    onExtendedChange?: (extended: boolean) => void;
    transition?: Transition;
    closeIcon?: Icon;
  };
  states: { isExtended: boolean };
  elements: [
    'slideSheet',
    'container',
    'title',
    'content',
    'header',
    'closeButton',
    'divider',
    'overlay',
  ];
}
