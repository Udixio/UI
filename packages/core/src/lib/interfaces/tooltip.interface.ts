import type {
  AnchorPosition,
  AnchorPositionAxis,
} from './anchor-positioner.interface';
import type { ComponentMotion } from './motion.interface';

export type TooltipVariant = 'plain' | 'rich';

export type TooltipTrigger = 'hover' | 'click' | 'focus' | null;

/** Tooltip placement shares its vocabulary with `AnchorPositioner`, which renders it. */
export type TooltipPosition = AnchorPosition;

/**
 * Tooltips display brief labels or messages.
 */
export interface TooltipProps {
  /** `'plain'` is a small text bubble; `'rich'` is a card-like surface with title/text/actions. */
  variant?: TooltipVariant;
  /** Headline of a rich tooltip. */
  title?: string;
  /** Supporting text for the tooltip. */
  text?: string;
  /** Placement relative to the target. Defaults to `bottom-right` for `variant="rich"`, `bottom` otherwise; tooltips inside a Toolbar use `auto`. */
  position?: TooltipPosition;
  /** Axis used when `position="auto"`. Defaults to `vertical`; Toolbar descendants derive it from their orientation. */
  autoAxis?: AnchorPositionAxis;
  /** Interaction(s) that open the tooltip. */
  trigger?: TooltipTrigger | TooltipTrigger[];
  /** Whether the open tooltip describes its target through `aria-describedby`. @default true */
  describeTarget?: boolean;
  /** Delay in milliseconds before showing the tooltip. Default: 400ms */
  openDelay?: number;
  /** Delay in milliseconds before hiding the tooltip. Default: 150ms */
  closeDelay?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Custom ID for accessibility linking. Auto-generated if not provided. */
  id?: string;
  /** The motion of the open/close height; the opacity keeps its own effects spring. Shared by every framework. */
  motion?: ComponentMotion;
}

export type TooltipStates = {
  /** Computed open state (controlled value or internal state). */
  isOpen: boolean;
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
  props: TooltipProps;
  states: TooltipStates;
  elements: Elements;
}
