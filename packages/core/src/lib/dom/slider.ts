import { animate, type AnimationPlaybackControls } from 'motion';
import { getSliderValueFromPercent } from '../behaviors/slider.behavior.js';
import type { SliderMark } from '../interfaces/slider.interface.js';

function systemPrefersReducedMotion(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

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
 * `afterRenderEffect`.
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
  duration?: number;
  reducedMotion?: () => boolean;
}

export interface SliderIndicatorController {
  setVisible(visible: boolean): void;
  destroy(): void;
}

/**
 * Owns the value indicator's show/hide animation: a 0↔1 scale, animated via
 * Motion JS. React and Angular both drive this from their `isChanging`
 * state instead of each carrying their own animation implementation, which
 * would inevitably drift.
 *
 * Motion writes the full `transform` shorthand for any transform-like key
 * it animates (including `scale`) rather than the standalone CSS `scale`
 * property, so this element must own no other `transform`: static
 * positioning (e.g. horizontal centering) belongs on a separate wrapper
 * around it, not on this element.
 *
 * Assumes the indicator starts hidden (both adapters render it with an
 * initial `transform: scale(0)` inline style before this controller ever
 * mounts, matching exactly what this controller itself would write), so the
 * first `setVisible(false)` a mount effect naturally fires is a no-op
 * instead of an animate-to-the-same-value call.
 */
export function createSliderIndicatorController({
  indicator,
  duration = 0.1,
  reducedMotion = systemPrefersReducedMotion,
}: SliderIndicatorControllerOptions): SliderIndicatorController {
  let animation: AnimationPlaybackControls | undefined;
  let requestedVisible = false;

  return {
    setVisible(visible) {
      if (requestedVisible === visible) return;
      requestedVisible = visible;

      animation?.stop();
      animation = undefined;

      if (reducedMotion()) {
        indicator.style.transform = `scale(${visible ? 1 : 0})`;
        return;
      }

      animation = animate(indicator, { scale: visible ? 1 : 0 }, { duration });
    },
    destroy() {
      animation?.stop();
    },
  };
}
