import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import type {
  TooltipInteractionState,
  TooltipTriggerKind,
} from '@udixio/core';
import {
  createTooltipTriggerController,
  type TooltipTriggerController,
} from '@udixio/core/dom';

type Trigger = TooltipTriggerKind | null;

export interface UseTooltipTriggerOptions {
  /**
   * The trigger element, when the caller already owns a ref to it. Omitted,
   * the hook creates its own and returns it as `triggerRef`.
   */
  targetRef?: RefObject<HTMLElement | null>;
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
  /** Put this on the trigger element. Equals `targetRef` when one was given. */
  triggerRef: RefObject<HTMLElement | null>;
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
 * Reactive React adapter over `createTooltipTriggerController`.
 *
 * The orchestration -- timers, pointer/keyboard/touch wiring, the touch long
 * press, `aria-describedby`, and cross-tooltip arbitration -- lives once in
 * `@udixio/core/dom` and is shared with the Angular adapter. This hook only
 * mirrors the controller's state into React and hands back a ref to attach.
 *
 * @remarks
 * Since `@udixio/ui-react@5.2.0` this hook returns `triggerRef` instead of the
 * former `triggerProps` handler bag: the controller attaches native listeners
 * itself, so there are no props to spread. Move `{...triggerProps}` on your
 * trigger to `ref={triggerRef}`.
 */
export function useTooltipTrigger({
  targetRef,
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

  const internalRef = useRef<HTMLElement | null>(null);
  const triggerRef = targetRef ?? internalRef;

  const isControlled = typeof openProp === 'boolean';
  const [internalState, setInternalState] = useState<TooltipInteractionState>(
    defaultOpen ? 'hovered' : 'hidden',
  );
  const [suppressedByPeer, setSuppressedByPeer] = useState(false);

  const state: TooltipInteractionState = isControlled
    ? openProp
      ? 'hovered'
      : 'hidden'
    : internalState;
  const isOpen = state !== 'hidden' && !suppressedByPeer;

  // The controller reads its options lazily, so every changing value goes
  // through one ref instead of tearing the listeners down on each render.
  const latest = useRef({
    triggers: [] as TooltipTriggerKind[],
    describeTarget,
    isControlled,
    openDelay,
    closeDelay,
    onOpenChange,
  });
  latest.current = {
    triggers: (Array.isArray(trigger) ? trigger : [trigger]).filter(
      (value): value is TooltipTriggerKind => value != null,
    ),
    describeTarget,
    isControlled,
    openDelay,
    closeDelay,
    onOpenChange,
  };

  const controllerRef = useRef<TooltipTriggerController | null>(null);

  useEffect(() => {
    const element = triggerRef.current;
    if (!element) return undefined;

    const controller = createTooltipTriggerController({
      target: element,
      tooltipId,
      triggers: () => latest.current.triggers,
      openDelay: () => latest.current.openDelay,
      closeDelay: () => latest.current.closeDelay,
      describeTarget: () => latest.current.describeTarget,
      isControlled: () => latest.current.isControlled,
      onStateChange: (next, suppressed) => {
        if (!latest.current.isControlled) setInternalState(next);
        setSuppressedByPeer(suppressed);
        latest.current.onOpenChange?.(next !== 'hidden');
      },
    });
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [tooltipId, triggerRef]);

  // Mirror the resolved state back into the controller. In controlled mode
  // this is how the machine learns the adapter's answer; uncontrolled it is a
  // no-op echo of what the controller just decided.
  useEffect(() => {
    controllerRef.current?.setControlledState(state);
  }, [state]);

  return {
    triggerRef,
    tooltipProps: {
      id: tooltipId,
      role: 'tooltip',
      'aria-hidden': !isOpen,
      onMouseEnter: () => controllerRef.current?.setSurfaceHovered(true),
      onMouseLeave: () => controllerRef.current?.setSurfaceHovered(false),
    },
    isOpen,
    state,
  };
}
