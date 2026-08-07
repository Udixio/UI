import type { AnchorPosition } from './anchor-positioner.interface';

export type TooltipVariant = 'plain' | 'rich';

export type TooltipTrigger = 'hover' | 'click' | 'focus' | null;

/** Tooltip placement shares its vocabulary with `AnchorPositioner`, which renders it. */
export type TooltipPosition = AnchorPosition;

/** Anime.js opacity/scale open-close timing, shared by every framework. */
export interface TooltipTransition {
  /** Duration in milliseconds. Default: 150ms */
  duration?: number;
  /** Anime.js easing name or function. Default: 'outCubic' */
  ease?: string;
}

export interface TooltipProps {
  /** `'plain'` is a small text bubble; `'rich'` is a card-like surface with title/text/actions. */
  variant?: TooltipVariant;
  /** Headline of a rich tooltip. */
  title?: string;
  /** Supporting text for the tooltip. */
  text?: string;
  /** Placement relative to the target. Defaults to `bottom-right` for `variant="rich"`, `bottom` otherwise. */
  position?: TooltipPosition;
  /** Interaction(s) that open the tooltip. */
  trigger?: TooltipTrigger | TooltipTrigger[];
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
  /** Anime.js opacity/scale open-close timing. Shared by every framework, no `motion/react`. */
  transition?: TooltipTransition;
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
