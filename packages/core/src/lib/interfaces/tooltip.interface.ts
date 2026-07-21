export type TooltipVariant = 'plain' | 'rich';

export type TooltipTrigger = 'hover' | 'click' | 'focus' | null;

export type TooltipPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

type Props = {
  variant?: TooltipVariant;
  /** Headline of a rich tooltip. */
  title?: string;
  /** Supporting text for the tooltip. */
  text?: string;
  position?: TooltipPosition;
  trigger?: TooltipTrigger | TooltipTrigger[];
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
};

export type TooltipStates = {
  /** Computed visibility of the tooltip (controlled value or internal state). */
  isVisible: boolean;
};

type Elements = [
  'toolTip',
  'container',
  'subHead',
  'supportingText',
  'actions',
  'content',
];

export interface TooltipInterface {
  type: 'div';
  props: Props;
  states: TooltipStates;
  elements: Elements;
}
