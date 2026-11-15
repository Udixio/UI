/** Damped spring: `dampingRatio` (ζ) and `stiffness` (k, so ω = √k). */
export interface SpringParams {
  dampingRatio: number;
  stiffness: number;
}

/** Longest settle time reported, in seconds. */
const maxSettleTime = 5;

/** Undamped frequency ω, after rejecting the overdamped regime. */
function omegaOf({ dampingRatio, stiffness }: SpringParams): number {
  if (dampingRatio > 1) throw new RangeError('Unsupported damping ratio');
  return Math.sqrt(stiffness);
}

/** Offset from the target at `t` seconds, for a spring starting `offset` away with `velocity` (units per second). */
export function springOffset(params: SpringParams, offset: number, velocity: number, t: number): number {
  const omega = omegaOf(params);
  const zeta = params.dampingRatio;
  if (zeta === 1) return Math.exp(-omega * t) * (offset + (velocity + omega * offset) * t);
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  const b = (velocity + zeta * omega * offset) / damped;
  return Math.exp(-zeta * omega * t) * (offset * Math.cos(damped * t) + b * Math.sin(damped * t));
}

/** Time derivative of `springOffset`. */
export function springVelocity(params: SpringParams, offset: number, velocity: number, t: number): number {
  const omega = omegaOf(params);
  const zeta = params.dampingRatio;
  if (zeta === 1) {
    const c = velocity + omega * offset;
    return Math.exp(-omega * t) * (c - omega * (offset + c * t));
  }
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  const b = (velocity + zeta * omega * offset) / damped;
  return Math.exp(-zeta * omega * t) * ((b * damped - zeta * omega * offset) * Math.cos(damped * t) - (offset * damped + zeta * omega * b) * Math.sin(damped * t));
}

/** Seconds after which the offset is guaranteed to stay within `epsilon` (an upper bound from the decay envelope, not the exact last crossing). */
export function springSettleTime(params: SpringParams, offset: number, velocity: number, epsilon: number): number {
  const omega = omegaOf(params);
  const zeta = params.dampingRatio;
  if (zeta === 1) {
    // Envelope bound e^(−ωt)·(|A| + |C|·t), scanned in 1 ms steps.
    const amplitude = Math.abs(offset);
    const slope = Math.abs(velocity + omega * offset);
    for (let ms = 0; ms <= maxSettleTime * 1000; ms++) {
      const t = ms / 1000;
      if (Math.exp(-omega * t) * (amplitude + slope * t) <= epsilon) return t;
    }
    return maxSettleTime;
  }
  const damped = omega * Math.sqrt(1 - zeta * zeta);
  const b = (velocity + zeta * omega * offset) / damped;
  const radius = Math.hypot(offset, b);
  if (radius <= epsilon) return 0;
  return Math.min(maxSettleTime, Math.log(radius / epsilon) / (zeta * omega));
}
