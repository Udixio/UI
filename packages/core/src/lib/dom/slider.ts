import { animate, type AnimationPlaybackControls } from 'motion';
import { motionPolicy } from '@udixio/motion/internal-policy';
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

export interface SliderIndicatorControllerOptions {
  /** The value-bubble element, scaled in/out around its bottom-center origin. */
  indicator: HTMLElement;
  /** Slider root containing the tracks and handle, including in Shadow DOM. */
  root: HTMLElement;
  duration?: number;
  /** Additional sampled preference, checked on calls and policy notifications. */
  reducedMotion?: () => boolean;
}

export interface SliderIndicatorController {
  setVisible(visible: boolean): void;
  destroy(): void;
}

/**
 * Owns the value indicator's show/hide animation: a 0↔1 scale, animated via
 * Motion JS. React, Angular and Svelte drive this from their `isChanging`
 * state instead of each carrying their own animation implementation, which
 * would inevitably drift.
 *
 * Motion writes the full `transform` shorthand for any transform-like key
 * it animates (including `scale`) rather than the standalone CSS `scale`
 * property, so this element must own no other `transform`: static
 * positioning (e.g. horizontal centering) belongs on a separate wrapper
 * around it, not on this element.
 *
 * Assumes the indicator starts hidden (all adapters render it with an
 * initial `transform: scale(0)` inline style before this controller ever
 * mounts, matching exactly what this controller itself would write), so the
 * first `setVisible(false)` a mount effect naturally fires is a no-op
 * instead of an animate-to-the-same-value call.
 */
export function createSliderIndicatorController({
  indicator,
  root,
  duration = 0.1,
  reducedMotion,
}: SliderIndicatorControllerOptions): SliderIndicatorController {
  let animation: AnimationPlaybackControls | undefined;
  let requestedVisible = false;
  let destroyed = false;
  let unsubscribe: (() => void) | undefined;

  const settle = () => {
    animation?.cancel();
    animation = undefined;
    indicator.style.transform = `scale(${requestedVisible ? 1 : 0})`;
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
      // Motion receives two scale functions: a computed matrix interpolates
      // discretely against scale(), so normalize the indicator's owned transform.
      const current = getComputedStyle(indicator).transform;
      const matrix = typeof DOMMatrixReadOnly === 'function' && current !== 'none'
        ? new DOMMatrixReadOnly(current) : undefined;
      const scale = matrix ? Math.hypot(matrix.a, matrix.b)
        : Number(current.match(/^scale\(([^)]+)\)$/)?.[1] ?? 1);
      animation?.cancel();
      const from = `scale(${scale})`;
      indicator.style.transform = from;
      animation = animate(indicator, { transform: [from, `scale(${visible ? 1 : 0})`] }, { duration });
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeAttribute('data-udx-slider-motion-reduce');
      try { unsubscribe?.(); } finally {
        try { animation?.cancel(); } finally { motionPolicy.release(); }
      }
    },
  };
}
