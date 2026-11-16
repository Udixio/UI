import {
  cssTiming,
  type CurveTiming,
  type SpringRef,
} from '@udixio/motion/animate';
import type { ComponentMotion } from '../interfaces/motion.interface.js';

/** The timing of a component's own surface when its `motion` names none: a 300 ms curve on the standard easing. */
const DEFAULT_TIMING: CurveTiming = {
  duration: 'duration.medium2',
  easing: 'easing.standard',
};

/** The motion of a component with its default timing filled in, for the adapters that time a child with it. */
export function resolveComponentMotion(motion?: ComponentMotion): {
  timing: SpringRef | CurveTiming;
} {
  return { timing: motion?.timing ?? DEFAULT_TIMING };
}

/**
 * The inline `transition` of a surface that moves on its motion: a curve gives its duration and easing, and a spring gives
 * its stylesheet variables (with the expressive fallback curve), for each listed property (`all` by default).
 * `defaultTiming` replaces the 300 ms curve when `motion` names none, for a surface that moves on a spring of its own.
 */
export function getComponentTransition(
  motion?: ComponentMotion,
  defaultTiming?: SpringRef | CurveTiming,
  properties: readonly string[] = ['all'],
): string {
  const { duration, easing } = cssTiming(motion?.timing ?? defaultTiming ?? DEFAULT_TIMING);
  return properties.map((property) => `${property} ${duration} ${easing}`).join(', ');
}

/**
 * The timing of a size that collapses to 0 (a height, a width): the effects spring of the speed of a spatial spring, since
 * a spatial spring overshoots its target and the overshoot is clamped at 0 at full speed. A curve and an effects spring
 * are kept as they are.
 */
export function collapseTimingOf(timing: SpringRef | CurveTiming): SpringRef | CurveTiming {
  return typeof timing === 'string' && timing.endsWith('.spatial') ? (timing.replace(/\.spatial$/, '.effects') as SpringRef) : timing;
}

/**
 * The easing of a progress indicator's value, as a CSS easing: the slow effects spring, which settles without a bounce.
 * A progress indicator keeps its own duration, which its `transitionDuration` sets.
 */
export const PROGRESS_VALUE_EASING: string = cssTiming('spring.slow.effects').easing;

/** The properties a chip's surface moves on: its colours, its border and shadow, and its padding, which changes with its icons. */
const CHIP_SURFACE_PROPERTIES = ['background-color', 'border-color', 'color', 'box-shadow', 'padding'];

/**
 * The inline `transition` of a chip's surface: its colours and its padding on the default effects spring, and nothing else.
 * It names its properties rather than `all`, so that a property a consumer adds is not animated by the chip.
 */
export function getChipSurfaceTransition(motion?: ComponentMotion): string {
  return getComponentTransition(motion, 'spring.default.effects', CHIP_SURFACE_PROPERTIES);
}

/**
 * The inline `transition` of a container that also staggers its own `gap` behind the movement: the gap lasts
 * `1 / divisor` of the duration, starts after the rest of it (a divisor of 2 for a horizontal item, 3 for a vertical one),
 * and eases on the same curve as the movement.
 */
export function getStaggeredComponentTransition(
  motion: ComponentMotion | undefined,
  divisor: number,
  defaultTiming?: SpringRef | CurveTiming,
): string {
  const { duration, easing } = cssTiming(motion?.timing ?? defaultTiming ?? DEFAULT_TIMING);
  return `all ${duration} ${easing}, gap calc(${duration} / ${divisor}) ${easing} calc(${duration} - ${duration} / ${divisor})`;
}
