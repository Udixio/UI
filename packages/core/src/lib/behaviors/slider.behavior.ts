import type { SliderMark } from '../interfaces/slider.interface';

/**
 * How long the value indicator stays visible after the last keyboard-driven
 * change, in ms. Shared by both adapters so a keyboard-triggered "changing"
 * state can't drift between frameworks; drag-driven visibility has no timer
 * (it tracks the gesture directly) and doesn't use this constant.
 */
export const SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS = 1500;

export interface SliderRange {
  min: number;
  max: number;
  step?: number;
  marks?: SliderMark[];
}

/**
 * Resolves the finite bounds used for percent math. `-Infinity`/`Infinity`
 * ends fall back to the first/last mark (or 0/100 without marks), so an
 * open-ended slider still has a real numeric range to interpolate within.
 */
export function resolveSliderBounds(
  min: number,
  max: number,
  marks?: SliderMark[],
): { min: number; max: number } {
  const finiteValues = (marks ?? [])
    .map((mark) => mark.value)
    .filter((value) => Number.isFinite(value));
  const resolvedMin =
    min === -Infinity
      ? finiteValues.length
        ? Math.min(...finiteValues)
        : 0
      : min;
  const resolvedMax =
    max === Infinity
      ? finiteValues.length
        ? Math.max(...finiteValues)
        : 100
      : max;
  return { min: resolvedMin, max: resolvedMax };
}

/** Converts a value to a 0..100 handle position. */
export function getSliderPercentFromValue(
  value: number,
  { min, max, marks }: SliderRange,
): number {
  if (value === Infinity) return 100;
  if (value === -Infinity) return 0;
  const bounds = resolveSliderBounds(min, max, marks);
  if (bounds.max === bounds.min) return 0;
  return ((value - bounds.min) / (bounds.max - bounds.min)) * 100;
}

/**
 * Snaps a raw value to `step` (or the nearest mark when no `step` is given),
 * then clamps it to the range, mapping a boundary landing back onto an
 * open `-Infinity`/`Infinity` end.
 */
export function snapSliderValue(
  rawValue: number,
  { min, max, step, marks }: SliderRange,
): number {
  const bounds = resolveSliderBounds(min, max, marks);

  if (rawValue >= bounds.max) return max === Infinity ? Infinity : bounds.max;
  if (rawValue <= bounds.min) return min === -Infinity ? -Infinity : bounds.min;

  let value = rawValue;
  if (step != null) {
    value = Math.round((value - bounds.min) / step) * step + bounds.min;
  } else if (marks && marks.length > 0) {
    value = marks.reduce((closest, mark) => {
      const markValue =
        mark.value === Infinity
          ? bounds.max
          : mark.value === -Infinity
            ? bounds.min
            : mark.value;
      const closestValue =
        closest.value === Infinity
          ? bounds.max
          : closest.value === -Infinity
            ? bounds.min
            : closest.value;
      return Math.abs(markValue - rawValue) < Math.abs(closestValue - rawValue)
        ? mark
        : closest;
    }).value;
  }

  if (value >= bounds.max) return max === Infinity ? Infinity : bounds.max;
  if (value <= bounds.min) return min === -Infinity ? -Infinity : bounds.min;
  return value;
}

/** Converts a pointer position (0..100, clamped) into a snapped slider value. */
export function getSliderValueFromPercent(
  percent: number,
  range: SliderRange,
): number {
  const clamped = Math.min(100, Math.max(0, percent));
  const bounds = resolveSliderBounds(range.min, range.max, range.marks);
  if (clamped >= 100) return range.max === Infinity ? Infinity : bounds.max;
  if (clamped <= 0) return range.min === -Infinity ? -Infinity : bounds.min;

  const rawValue =
    ((bounds.max - bounds.min) * clamped) / 100 + bounds.min;
  return snapSliderValue(rawValue, range);
}

export type SliderKeyboardKey =
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowLeft'
  | 'ArrowDown'
  | 'Home'
  | 'End';

export interface SliderKeyboardTransitionOptions extends SliderRange {
  key: string;
  value: number;
  disabled?: boolean;
}

export type SliderKeyboardTransition =
  | { blocked: true; nextValue?: never }
  | { blocked: false; nextValue: number };

function sortedMarkValues(marks: SliderMark[], bounds: { min: number; max: number }) {
  return [...marks]
    .map((mark) =>
      mark.value === Infinity
        ? bounds.max
        : mark.value === -Infinity
          ? bounds.min
          : mark.value,
    )
    .sort((a, b) => a - b);
}

/**
 * Pure transition for ArrowLeft/Right/Up/Down/Home/End. Independent of the
 * DOM: adapters call this from their keydown handler and apply the result
 * through their controllable-state primitive (which also dedupes a no-op
 * transition).
 */
export function getSliderKeyboardTransition({
  key,
  value,
  min,
  max,
  step,
  marks,
  disabled,
}: SliderKeyboardTransitionOptions): SliderKeyboardTransition {
  if (disabled) return { blocked: true };

  if (key === 'Home') {
    return {
      blocked: false,
      nextValue: snapSliderValue(min === -Infinity ? -Infinity : min, {
        min,
        max,
        step,
        marks,
      }),
    };
  }
  if (key === 'End') {
    return {
      blocked: false,
      nextValue: snapSliderValue(max === Infinity ? Infinity : max, {
        min,
        max,
        step,
        marks,
      }),
    };
  }

  const direction =
    key === 'ArrowRight' || key === 'ArrowUp'
      ? 1
      : key === 'ArrowLeft' || key === 'ArrowDown'
        ? -1
        : null;
  if (direction == null) return { blocked: true };

  if (step != null) {
    return {
      blocked: false,
      nextValue: snapSliderValue(value + direction * step, {
        min,
        max,
        step,
        marks,
      }),
    };
  }

  if (marks && marks.length > 0) {
    const bounds = resolveSliderBounds(min, max, marks);
    const resolvedValue = value === Infinity ? bounds.max : value === -Infinity ? bounds.min : value;
    const values = sortedMarkValues(marks, bounds);
    const currentIndex = values.indexOf(resolvedValue);
    const nextIndex = currentIndex === -1 ? -1 : currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= values.length) return { blocked: true };
    return { blocked: false, nextValue: values[nextIndex] };
  }

  return { blocked: true };
}
