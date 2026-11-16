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
 * The inline `transition` of a surface that moves on its motion, for every property: a curve gives its duration and
 * easing, and a spring gives its stylesheet variables (with the expressive fallback curve).
 */
export function getComponentTransition(motion?: ComponentMotion): string {
  const { duration, easing } = cssTiming(resolveComponentMotion(motion).timing);
  return `all ${duration} ${easing}`;
}

/**
 * The inline `transition` of a container that also staggers its own `gap` behind the movement: the gap lasts
 * `1 / divisor` of the duration and starts after the rest of it (a divisor of 2 for a horizontal item, 3 for a vertical one).
 */
export function getStaggeredComponentTransition(
  motion: ComponentMotion | undefined,
  divisor: number,
): string {
  const { duration, easing } = cssTiming(resolveComponentMotion(motion).timing);
  return `all ${duration} ${easing}, gap calc(${duration} / ${divisor}) calc(${duration} - ${duration} / ${divisor})`;
}
