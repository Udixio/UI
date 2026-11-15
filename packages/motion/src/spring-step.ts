import type { SpringParams } from './spring.js';

/** A spring along one axis: where it is, and how fast it moves. */
export interface SpringState {
  x: number;
  v: number;
}

/** The longest sub-step of the integration, in seconds. */
const MAX_STEP = 1 / 240;

/**
 * Advance a damped spring towards `target` by `dt` seconds: semi-implicit Euler, in sub-steps of at most 1/240 s. The
 * state is updated in place, so that a spring keeps its velocity when its target moves.
 */
export function stepSpring(state: SpringState, target: number, dt: number, params: SpringParams): void {
  const { dampingRatio, stiffness } = params;
  const damping = 2 * dampingRatio * Math.sqrt(stiffness);
  const steps = Math.ceil(dt / MAX_STEP);
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const acceleration = -stiffness * (state.x - target) - damping * state.v;
    state.v += acceleration * h;
    state.x += state.v * h;
  }
}
