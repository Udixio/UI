import {
  animateStyle,
  type CurveTiming,
  type MotionHandle,
  type SpringRef,
} from '@udixio/motion/animate';
import { motionPolicy } from '@udixio/motion/policy';
import { getSliderValueFromPercent } from '../behaviors/slider.behavior.js';
import type { SliderMark } from '../interfaces/slider.interface.js';

export interface SliderPointerControllerOptions {
  /** The element whose width defines the 0..100% drag range. */
  track: HTMLElement;
  min: () => number;
  max: () => number;
  step: () => number | undefined;
  marks: () => SliderMark[] | undefined;
  disabled: () => boolean;
  /** Called with the snapped value at pointer-down and on every move while dragging. */
  onValueChange: (value: number) => void;
  /** Called when a drag starts/ends (mouse/touch down through up/cancel). */
  onDraggingChange?: (dragging: boolean) => void;
}

export interface SliderPointerController {
  destroy(): void;
}

function clientXFromEvent(event: MouseEvent | TouchEvent): number | null {
  if ('touches' in event) {
    const touch = event.touches[0] ?? event.changedTouches[0];
    return touch ? touch.clientX : null;
  }
  return event.clientX;
}

/**
 * Owns the slider's imperative drag concern: translating pointer/touch
 * position into a snapped value and tracking the drag gesture across the
 * whole window (a drag routinely leaves the narrow track). The value math
 * itself lives in `slider.behavior.ts`; this controller only reads geometry
 * and applies the result through `onValueChange`, leaving deduplication and
 * controlled/uncontrolled handling to the adapter's controllable-state
 * primitive.
 *
 * React connects it in `useEffect`; Angular connects it in
 * `afterRenderEffect`; Svelte connects it in `$effect`.
 */
export function createSliderPointerController({
  track,
  min,
  max,
  step,
  marks,
  disabled,
  onValueChange,
  onDraggingChange,
}: SliderPointerControllerOptions): SliderPointerController {
  let dragging = false;

  const applyPosition = (event: MouseEvent | TouchEvent) => {
    const clientX = clientXFromEvent(event);
    if (clientX == null) return;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    onValueChange(
      getSliderValueFromPercent(percent, {
        min: min(),
        max: max(),
        step: step(),
        marks: marks(),
      }),
    );
  };

  const handleMove = (event: MouseEvent | TouchEvent) => applyPosition(event);

  const stopDragging = () => {
    if (!dragging) return;
    dragging = false;
    onDraggingChange?.(false);
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', stopDragging);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', stopDragging);
    window.removeEventListener('touchcancel', stopDragging);
  };

  const startDragging = () => {
    if (dragging) return;
    dragging = true;
    onDraggingChange?.(true);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', stopDragging);
    window.addEventListener('touchcancel', stopDragging);
  };

  const handleStart = (event: MouseEvent | TouchEvent) => {
    if (disabled()) return;
    startDragging();
    applyPosition(event);
  };

  const preventNativeDrag = (event: Event) => event.preventDefault();

  track.addEventListener('mousedown', handleStart);
  track.addEventListener('touchstart', handleStart, { passive: true });
  track.addEventListener('dragstart', preventNativeDrag);

  return {
    destroy() {
      stopDragging();
      track.removeEventListener('mousedown', handleStart);
      track.removeEventListener('touchstart', handleStart);
      track.removeEventListener('dragstart', preventNativeDrag);
    },
  };
}

/** The options of `createSliderIndicatorController`: the value bubble, the slider root and its motion. */
export interface SliderIndicatorControllerOptions {
  /** The value-bubble element, scaled in/out around its bottom-center origin. */
  indicator: HTMLElement;
  /** Slider root containing the tracks and handle, including in Shadow DOM. */
  root: HTMLElement;
  /** The motion of the show and hide; `spring.fast.effects` by default. */
  timing?: SpringRef | CurveTiming;
  /** Additional sampled preference, checked on calls and policy notifications. */
  reducedMotion?: () => boolean;
}

/** A value bubble that shows and hides with the slider's changing state; `destroy()` releases its policy. */
export interface SliderIndicatorController {
  /** Shows (`true`) or hides (`false`) the value indicator, animated unless the policy is reduced. */
  setVisible(visible: boolean): void;
  /** Stops the indicator's motion and releases the document policy it holds. */
  destroy(): void;
}

/**
 * Owns the value indicator's show/hide animation: a 0↔1 `scale`, played on
 * `@udixio/motion`. React, Angular and Svelte drive this from their
 * `isChanging` state instead of each carrying their own animation
 * implementation, which would inevitably drift.
 *
 * The scale is the standalone CSS `scale` property, not `transform`, so the
 * element may keep its own `transform` and the static positioning of a
 * wrapper stays independent of it. Adapters render the indicator with an
 * inline `scale: 0` before this controller mounts, so it starts hidden and
 * the first `setVisible(false)` a mount effect fires is a no-op rather than
 * an animation to the same value.
 */
export function createSliderIndicatorController({
  indicator,
  root,
  timing = 'spring.fast.effects',
  reducedMotion,
}: SliderIndicatorControllerOptions): SliderIndicatorController {
  let motion: MotionHandle | undefined;
  let requestedVisible = false;
  let destroyed = false;
  let unsubscribe: (() => void) | undefined;

  const settle = () => {
    motion?.cancel();
    motion = undefined;
    indicator.style.setProperty('scale', requestedVisible ? '1' : '0');
  };
  motionPolicy.retain();
  try {
    const applyPolicy = () => {
      const reduced = motionPolicy.reduced;
      root.toggleAttribute('data-udx-slider-motion-reduce', reduced);
      if (reduced || reducedMotion?.()) settle();
    };
    unsubscribe = motionPolicy.subscribe(applyPolicy);
    applyPolicy();
  } catch (error) {
    root.removeAttribute('data-udx-slider-motion-reduce');
    try { unsubscribe?.(); } catch { /* Preserve installation error. */ }
    try { motionPolicy.release(); } catch { /* Preserve installation error. */ }
    throw error;
  }

  return {
    setVisible(visible) {
      if (destroyed) return;
      const changed = requestedVisible !== visible;
      requestedVisible = visible;
      if (motionPolicy.reduced || reducedMotion?.()) {
        settle();
        return;
      }
      if (!changed) return;
      // animateStyle carries the computed scale, so a change during a running
      // show or hide continues from the size the indicator has now.
      motion = animateStyle(indicator, { scale: visible ? '1' : '0' }, { timing });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeAttribute('data-udx-slider-motion-reduce');
      try { unsubscribe?.(); } finally {
        try { motion?.cancel(); } finally { motionPolicy.release(); }
      }
    },
  };
}
