/** A keyframe of an indeterminate loop: its offset along the cycle (0 to 1) and the value of each property at it. */
export type LoopKeyframe<Key extends string> = { offset: number } & Record<Key, number>;

/** The easeInOut that the loops have always used: the CSS cubic-bezier(0.42, 0, 0.58, 1). */
const easeInOut = cubicBezier(0.42, 0, 0.58, 1);

/** The easing of a cubic-bezier curve from (0, 0) to (1, 1), as a function of the progress. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (progress: number) => number {
  const coordinate = (p1: number, p2: number) => (t: number) =>
    3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  const x = coordinate(x1, x2);
  const y = coordinate(y1, y2);
  return (progress) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    // With x1 and x2 in [0, 1], x grows with t: bisect for the t that reaches the progress, then read y there.
    let low = 0;
    let high = 1;
    for (let i = 0; i < 60; i++) {
      const middle = (low + high) / 2;
      if (x(middle) < progress) low = middle;
      else high = middle;
    }
    return y((low + high) / 2);
  };
}

/**
 * The keyframes of an indeterminate loop, where each segment between two offsets eases on its own; the samples are linear,
 * since `animateStyle` takes one easing for the whole cycle.
 */
export function easedLoopKeyframes<Key extends string>(
  offsets: readonly number[],
  values: Record<Key, readonly number[]>,
  samples = 32,
): LoopKeyframe<Key>[] {
  const keys = Object.keys(values) as Key[];
  for (const key of keys) {
    if (values[key].length !== offsets.length) throw new RangeError(`The values of ${key} do not match the offsets`);
  }
  if (!Number.isInteger(samples) || samples < 1) throw new RangeError('Invalid sample count');
  const frames: LoopKeyframe<Key>[] = [];
  for (let segment = 0; segment < offsets.length - 1; segment++) {
    const span = offsets[segment + 1] - offsets[segment];
    for (let step = 0; step < samples; step++) {
      const eased = easeInOut(step / samples);
      frames.push(
        keyframe(keys, offsets[segment] + span * (step / samples), (key) => {
          const from = values[key][segment];
          return from + (values[key][segment + 1] - from) * eased;
        }),
      );
    }
  }
  const last = offsets.length - 1;
  frames.push(keyframe(keys, offsets[last], (key) => values[key][last]));
  return frames;
}

function keyframe<Key extends string>(
  keys: readonly Key[],
  offset: number,
  valueOf: (key: Key) => number,
): LoopKeyframe<Key> {
  const frame: Record<string, number> = { offset };
  for (const key of keys) frame[key] = valueOf(key);
  return frame as LoopKeyframe<Key>;
}
