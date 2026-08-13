export type TooltipTriggerKind = 'hover' | 'click' | 'focus';

/** Material 3 long-press recognition delay for touch tooltips. */
export const TOOLTIP_LONG_PRESS_DELAY = 500;

/** Material 3 duration a touch tooltip remains visible after release. */
export const TOOLTIP_TOUCH_HIDE_DELAY = 1500;

/** Movement tolerated before a pending touch long press is cancelled. */
export const TOOLTIP_TOUCH_MOVE_TOLERANCE = 10;

/**
 * Internal interaction state, ordered by priority (`clicked` > `focused` >
 * `hovered` > `hidden`): a lower-priority source (for example a mouse leave)
 * never closes a tooltip kept open by a higher-priority one (a click).
 */
export type TooltipInteractionState =
  | 'hidden'
  | 'hovered'
  | 'focused'
  | 'clicked';

export type TooltipInteractionEvent =
  | 'pointerEnter'
  | 'pointerLeave'
  | 'focus'
  | 'blur'
  | 'click'
  | 'escape'
  | 'surfaceLeave';

export interface TooltipInteractionContext {
  state: TooltipInteractionState;
  triggers: TooltipTriggerKind[];
  /** Whether the pointer is currently over the tooltip surface itself. */
  isSurfaceHovered: boolean;
}

const PRIORITY: Record<TooltipInteractionState, number> = {
  hidden: 0,
  hovered: 1,
  focused: 2,
  clicked: 3,
};

/**
 * Resolves one tooltip interaction event to its next state, or `null` when
 * the event is a no-op for the current context. Pure and framework-free:
 * both `useTooltipTrigger` (React) and the Angular tooltip trigger reuse
 * this single set of rules instead of each re-deriving the state machine.
 */
export function resolveTooltipInteraction(
  context: TooltipInteractionContext,
  event: TooltipInteractionEvent,
): TooltipInteractionState | null {
  const { state, triggers, isSurfaceHovered } = context;

  switch (event) {
    case 'pointerEnter':
      if (!triggers.includes('hover')) return null;
      return PRIORITY.hovered > PRIORITY[state] ? 'hovered' : null;

    case 'pointerLeave':
      if (!triggers.includes('hover')) return null;
      if (state === 'focused' || state === 'clicked') return null;
      if (isSurfaceHovered) return null;
      return state === 'hidden' ? null : 'hidden';

    case 'focus':
      if (!triggers.includes('focus')) return null;
      return state === 'focused' ? null : 'focused';

    case 'blur':
      if (!triggers.includes('focus')) return null;
      if (state === 'clicked') return null;
      if (triggers.includes('hover') && isSurfaceHovered) {
        return state === 'hovered' ? null : 'hovered';
      }
      return state === 'hidden' ? null : 'hidden';

    case 'click':
      if (!triggers.includes('click')) return null;
      return state === 'clicked' ? 'hidden' : 'clicked';

    case 'escape':
      return state === 'hidden' ? null : 'hidden';

    case 'surfaceLeave':
      if (triggers.includes('hover') && state === 'hovered') return 'hidden';
      return null;

    default:
      return null;
  }
}
