import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  resolveTooltipInteraction,
  TOOLTIP_LONG_PRESS_DELAY,
  TOOLTIP_TOUCH_HIDE_DELAY,
  TOOLTIP_TOUCH_MOVE_TOLERANCE,
  type TooltipInteractionState,
  type TooltipTriggerKind,
} from '@udixio/core';
import {
  claimTooltipVisibility,
  listenForTooltipVisibilityClaims,
} from '@udixio/core/dom';

type Trigger = TooltipTriggerKind | null;

export interface UseTooltipTriggerOptions {
  trigger?: Trigger | Trigger[];
  describeTarget?: boolean;
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
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
    onContextMenu: (event: React.MouseEvent) => void;
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
  describeTarget = true,
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
  const hasHoverTrigger = triggers.includes('hover');

  const isControlled = typeof openProp === 'boolean';
  const [internalState, setInternalState] = useState<TooltipInteractionState>(
    defaultOpen ? 'hovered' : 'hidden',
  );
  const [isSurfaceHovered, setIsSurfaceHovered] = useState(false);
  const [suppressedByPeer, setSuppressedByPeer] = useState(false);

  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPointerRef = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const touchLongPressOpenedRef = useRef(false);
  const suppressTouchCompatibilityEventsRef = useRef(false);
  const compatibilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearTimeouts = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (compatibilityTimeoutRef.current) {
      clearTimeout(compatibilityTimeoutRef.current);
      compatibilityTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearTimeouts, [clearTimeouts]);

  const state: TooltipInteractionState = isControlled
    ? openProp
      ? 'hovered'
      : 'hidden'
    : internalState;
  const isStateOpen = state !== 'hidden';
  const isOpen = isStateOpen && !suppressedByPeer;

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    return listenForTooltipVisibilityClaims(document, tooltipId, () => {
      if (!isStateOpen || suppressedByPeer) return;
      setSuppressedByPeer(true);
      if (!isControlled) setInternalState('hidden');
      onOpenChange?.(false);
    });
  }, [isControlled, isStateOpen, onOpenChange, suppressedByPeer, tooltipId]);

  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      claimTooltipVisibility(document, tooltipId);
    }
  }, [isOpen, tooltipId]);

  const commit = useCallback(
    (next: TooltipInteractionState) => {
      if (!isControlled) setInternalState(next);
      if (next !== 'hidden') {
        setSuppressedByPeer(false);
        if (typeof document !== 'undefined') {
          claimTooltipVisibility(document, tooltipId);
        }
      }
      onOpenChange?.(next !== 'hidden');
    },
    [isControlled, onOpenChange, tooltipId],
  );

  const request = useCallback(
    (event: Parameters<typeof resolveTooltipInteraction>[1], delayMs = 0) => {
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

  const handleMouseEnter = useCallback(() => {
    if (!suppressTouchCompatibilityEventsRef.current) {
      request('pointerEnter', openDelay);
    }
  }, [request, openDelay]);
  const handleMouseLeave = useCallback(() => {
    if (!suppressTouchCompatibilityEventsRef.current) {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      request('pointerLeave', closeDelay);
    }
  }, [request, closeDelay]);
  const handleFocus = useCallback(() => {
    if (!suppressTouchCompatibilityEventsRef.current) request('focus');
  }, [request]);
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
  }, [
    state,
    triggers.join(','),
    isSurfaceHovered,
    commit,
    clearTimeouts,
    closeDelay,
  ]);
  const handleClick = useCallback(() => {
    if (!touchLongPressOpenedRef.current) request('click');
  }, [request]);

  const finishTouch = useCallback(
    (event: React.PointerEvent) => {
      if (touchPointerRef.current?.id !== event.pointerId) return;
      touchPointerRef.current = null;
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      if (touchLongPressOpenedRef.current) {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          touchLongPressOpenedRef.current = false;
          suppressTouchCompatibilityEventsRef.current = false;
          commit('hidden');
        }, TOOLTIP_TOUCH_HIDE_DELAY);
      } else {
        compatibilityTimeoutRef.current = setTimeout(() => {
          suppressTouchCompatibilityEventsRef.current = false;
        }, 0);
      }
    },
    [commit],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.pointerType !== 'touch' || !hasHoverTrigger) return;
      clearTimeouts();
      touchPointerRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      };
      touchLongPressOpenedRef.current = false;
      suppressTouchCompatibilityEventsRef.current = true;
      openTimeoutRef.current = setTimeout(() => {
        touchLongPressOpenedRef.current = true;
        commit('hovered');
      }, TOOLTIP_LONG_PRESS_DELAY);
    },
    [clearTimeouts, commit, hasHoverTrigger],
  );

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const touch = touchPointerRef.current;
    if (
      !touch ||
      touch.id !== event.pointerId ||
      touchLongPressOpenedRef.current
    ) {
      return;
    }
    if (
      Math.hypot(event.clientX - touch.x, event.clientY - touch.y) <=
      TOOLTIP_TOUCH_MOVE_TOLERANCE
    ) {
      return;
    }
    touchPointerRef.current = null;
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    compatibilityTimeoutRef.current = setTimeout(() => {
      suppressTouchCompatibilityEventsRef.current = false;
    }, 0);
  }, []);
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    if (touchPointerRef.current || touchLongPressOpenedRef.current) {
      event.preventDefault();
    }
  }, []);
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
      'aria-describedby': isOpen && describeTarget ? tooltipId : undefined,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishTouch,
      onPointerCancel: finishTouch,
      onContextMenu: handleContextMenu,
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
