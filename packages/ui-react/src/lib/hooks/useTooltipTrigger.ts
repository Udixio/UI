import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  resolveTooltipInteraction,
  type TooltipInteractionState,
  type TooltipTriggerKind,
} from '@udixio/core';

type Trigger = TooltipTriggerKind | null;

export interface UseTooltipTriggerOptions {
  trigger?: Trigger | Trigger[];
  open?: boolean;
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
  state: TooltipInteractionState;
}

/**
 * Owns the tooltip trigger's timers, DOM event wiring, and accessibility
 * props. The interaction decision itself -- whether an event opens, closes,
 * or is a no-op -- is delegated to `resolveTooltipInteraction`, the pure
 * function shared with the Angular adapter, so the state machine's rules
 * live in exactly one place.
 */
export function useTooltipTrigger({
  trigger = ['hover', 'focus'],
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openDelay = 400,
  closeDelay = 150,
  id: idProp,
}: UseTooltipTriggerOptions = {}): UseTooltipTriggerReturn {
  const generatedId = useId();
  const tooltipId = idProp ?? `tooltip-${generatedId}`;

  const triggers = (Array.isArray(trigger) ? trigger : [trigger]).filter(
    (value): value is TooltipTriggerKind => value != null,
  );

  const isControlled = typeof openProp === 'boolean';
  const [internalState, setInternalState] = useState<TooltipInteractionState>(
    defaultOpen ? 'hovered' : 'hidden',
  );
  const [isSurfaceHovered, setIsSurfaceHovered] = useState(false);

  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => clearTimeouts, [clearTimeouts]);

  const state: TooltipInteractionState = isControlled
    ? openProp
      ? 'hovered'
      : 'hidden'
    : internalState;
  const isOpen = state !== 'hidden';

  const commit = useCallback(
    (next: TooltipInteractionState) => {
      if (!isControlled) setInternalState(next);
      onOpenChange?.(next !== 'hidden');
    },
    [isControlled, onOpenChange],
  );

  const request = useCallback(
    (
      event: Parameters<typeof resolveTooltipInteraction>[1],
      delayMs = 0,
    ) => {
      const next = resolveTooltipInteraction(
        { state, triggers, isSurfaceHovered },
        event,
      );
      if (next === null) return;
      clearTimeouts();
      if (delayMs > 0) {
        const ref = next === 'hidden' ? closeTimeoutRef : openTimeoutRef;
        ref.current = setTimeout(() => commit(next), delayMs);
      } else {
        commit(next);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, triggers.join(','), isSurfaceHovered, commit, clearTimeouts],
  );

  const handleMouseEnter = useCallback(
    () => request('pointerEnter', openDelay),
    [request, openDelay],
  );
  const handleMouseLeave = useCallback(
    () => request('pointerLeave', closeDelay),
    [request, closeDelay],
  );
  const handleFocus = useCallback(() => request('focus'), [request]);
  const handleBlur = useCallback(() => {
    const next = resolveTooltipInteraction(
      { state, triggers, isSurfaceHovered },
      'blur',
    );
    if (next === null) return;
    clearTimeouts();
    if (next === 'hidden') {
      closeTimeoutRef.current = setTimeout(() => commit(next), closeDelay);
    } else {
      commit(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, triggers.join(','), isSurfaceHovered, commit, clearTimeouts, closeDelay]);
  const handleClick = useCallback(() => request('click'), [request]);
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        request('escape');
        event.preventDefault();
      }
    },
    [request, isOpen],
  );

  const handleTooltipMouseEnter = useCallback(() => {
    setIsSurfaceHovered(true);
    clearTimeouts();
  }, [clearTimeouts]);
  const handleTooltipMouseLeave = useCallback(() => {
    setIsSurfaceHovered(false);
    request('surfaceLeave', closeDelay);
  }, [request, closeDelay]);

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
