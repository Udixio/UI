import { useCallback, useEffect, useId, useRef, useState } from 'react';

type Trigger = 'hover' | 'click' | 'focus' | null;

type TooltipState = 'hidden' | 'hovered' | 'focused' | 'clicked';

export interface UseTooltipTriggerOptions {
  trigger?: Trigger | Trigger[];
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  id?: string;
}

export interface UseTooltipTriggerReturn {
  triggerProps: {
    'aria-describedby': string | undefined;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
    onClick: () => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  tooltipProps: {
    id: string;
    role: 'tooltip';
    'aria-hidden': boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  isOpen: boolean;
  state: TooltipState;
}

/**
 * Hook to manage tooltip trigger state machine, events, and accessibility props.
 *
 * State Machine:
 * - States: hidden | hovered | focused | clicked
 * - Priority: clicked > focused > hovered > hidden
 * - Focus takes priority over hover (don't close on mouse leave if focused)
 * - Escape key closes tooltip from any open state
 * - Click toggles for 'click' trigger
 */
export function useTooltipTrigger({
  trigger = ['hover', 'focus'],
  isOpen: isOpenProp,
  defaultOpen = false,
  onOpenChange,
  openDelay = 400,
  closeDelay = 150,
  id: idProp,
}: UseTooltipTriggerOptions = {}): UseTooltipTriggerReturn {
  const generatedId = useId();
  const tooltipId = idProp ?? `tooltip-${generatedId}`;

  // Normalize trigger to array
  const triggers = Array.isArray(trigger) ? trigger : [trigger];

  // Controlled vs uncontrolled state
  const isControlled = typeof isOpenProp === 'boolean';
  const [internalState, setInternalState] = useState<TooltipState>(
    defaultOpen ? 'hovered' : 'hidden',
  );

  // Track if tooltip content is being hovered (for pointer intent)
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  // Timeout refs for delayed open/close
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  // State transition function
  const transition = useCallback(
    (newState: TooltipState) => {
      if (isControlled) {
        // In controlled mode, notify parent of desired state change
        const shouldBeOpen = newState !== 'hidden';
        onOpenChange?.(shouldBeOpen);
      } else {
        setInternalState(newState);
        const shouldBeOpen = newState !== 'hidden';
        onOpenChange?.(shouldBeOpen);
      }
    },
    [isControlled, onOpenChange],
  );

  // Compute actual state and isOpen
  const state = isControlled
    ? isOpenProp
      ? 'hovered' // Simplified: in controlled mode, we just track open/closed
      : 'hidden'
    : internalState;

  const isOpen = state !== 'hidden';

  // Get state priority for comparison
  const getStatePriority = (s: TooltipState): number => {
    switch (s) {
      case 'hidden':
        return 0;
      case 'hovered':
        return 1;
      case 'focused':
        return 2;
      case 'clicked':
        return 3;
      default:
        return 0;
    }
  };

  // Schedule opening with delay
  const scheduleOpen = useCallback(
    (targetState: TooltipState) => {
      clearTimeouts();

      // Only transition if new state has higher priority
      if (getStatePriority(targetState) <= getStatePriority(state)) {
        return;
      }

      openTimeoutRef.current = setTimeout(() => {
        transition(targetState);
      }, openDelay);
    },
    [clearTimeouts, openDelay, state, transition],
  );

  // Schedule closing with delay
  const scheduleClose = useCallback(
    (fromState: TooltipState) => {
      clearTimeouts();

      closeTimeoutRef.current = setTimeout(() => {
        // Only close if we're still in the same state (or lower priority)
        if (
          !isControlled &&
          getStatePriority(internalState) <= getStatePriority(fromState)
        ) {
          transition('hidden');
        } else if (isControlled) {
          transition('hidden');
        }
      }, closeDelay);
    },
    [clearTimeouts, closeDelay, internalState, isControlled, transition],
  );

  // Event handlers for trigger element
  const handleMouseEnter = useCallback(() => {
    if (!triggers.includes('hover')) return;
    scheduleOpen('hovered');
  }, [triggers, scheduleOpen]);

  const handleMouseLeave = useCallback(() => {
    if (!triggers.includes('hover')) return;

    // Don't close if focused (focus has higher priority)
    if (state === 'focused' || state === 'clicked') return;

    // Don't close immediately if tooltip itself is hovered
    if (isTooltipHovered) return;

    scheduleClose('hovered');
  }, [triggers, state, isTooltipHovered, scheduleClose]);

  const handleFocus = useCallback(() => {
    if (!triggers.includes('focus')) return;
    clearTimeouts();
    transition('focused');
  }, [triggers, clearTimeouts, transition]);

  const handleBlur = useCallback(() => {
    if (!triggers.includes('focus')) return;

    // Don't close if clicked (clicked has higher priority)
    if (state === 'clicked') return;

    // If also hovering, transition to hovered state
    if (triggers.includes('hover') && isTooltipHovered) {
      transition('hovered');
      return;
    }

    scheduleClose('focused');
  }, [triggers, state, isTooltipHovered, scheduleClose, transition]);

  const handleClick = useCallback(() => {
    if (!triggers.includes('click')) return;

    clearTimeouts();

    // Toggle behavior for click trigger
    if (state === 'clicked') {
      transition('hidden');
    } else {
      transition('clicked');
    }
  }, [triggers, state, clearTimeouts, transition]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Escape closes tooltip from any open state
      if (event.key === 'Escape' && isOpen) {
        clearTimeouts();
        transition('hidden');
        event.preventDefault();
      }
    },
    [isOpen, clearTimeouts, transition],
  );

  // Event handlers for tooltip element (pointer intent)
  const handleTooltipMouseEnter = useCallback(() => {
    setIsTooltipHovered(true);
    clearTimeouts();
  }, [clearTimeouts]);

  const handleTooltipMouseLeave = useCallback(() => {
    setIsTooltipHovered(false);

    // If trigger includes hover and we're in hover state, schedule close
    if (triggers.includes('hover') && state === 'hovered') {
      scheduleClose('hovered');
    }
  }, [triggers, state, scheduleClose]);

  return {
    triggerProps: {
      'aria-describedby': isOpen ? tooltipId : undefined,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
    },
    tooltipProps: {
      id: tooltipId,
      role: 'tooltip',
      'aria-hidden': !isOpen,
      onMouseEnter: handleTooltipMouseEnter,
      onMouseLeave: handleTooltipMouseLeave,
    },
    isOpen,
    state,
  };
}
