/** One value read at one animation frame; `t` is the frame's timestamp in milliseconds. */
export type Sample = { readonly t: number; readonly value: number };

/**
 * The tolerance of the reference comparison (spec §7): one px, or 0.004 of a scale, frame by frame.
 */
export const NO_JUMP = { referencePx: 1, referenceScale: 0.004 } as const;

/** Reads `read` once per animation frame, `frames` times, and resolves the samples in frame order. */
export async function sampleFrames(
  read: () => number,
  frames: number,
): Promise<Sample[]> {
  const samples: Sample[] = [];
  for (let frame = 0; frame < frames; frame++) {
    const t = await nextFrame();
    samples.push({ t, value: read() });
  }
  return samples;
}

/** Resolves at the timestamp of the next animation frame. */
function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * The largest move between two consecutive samples, and the largest ratio of a move to the largest move before it (moves from
 * rest have no ratio). For the calibration's log only: it judges nothing.
 */
export function jumpStats(samples: readonly Sample[]): {
  maxMove: number;
  maxRatio: number;
} {
  const moves = samples
    .slice(1)
    .map((sample, i) => Math.abs(sample.value - samples[i].value));
  let maxMove = 0;
  let maxRatio = 0;
  moves.forEach((move, i) => {
    maxMove = Math.max(maxMove, move);
    const history = Math.max(
      i >= 1 ? moves[i - 1] : 0,
      i >= 2 ? moves[i - 2] : 0,
    );
    if (history > 0) maxRatio = Math.max(maxRatio, move / history);
  });
  return { maxMove, maxRatio };
}

/**
 * Throws an `Error` naming the first frame where `samples` is farther than the tolerance from `reference`, the same transition
 * on a twin element started in the same task and sampled in the same frames. The lengths must match.
 */
export function expectNoJump(
  samples: readonly Sample[],
  unit: 'px' | 'scale',
  reference: readonly Sample[],
): void {
  if (reference.length !== samples.length) {
    throw new Error(
      `The reference has ${reference.length} frames, the transition ${samples.length}`,
    );
  }
  const tolerance =
    unit === 'px' ? NO_JUMP.referencePx : NO_JUMP.referenceScale;
  samples.forEach((sample, index) => {
    const gap = Math.abs(sample.value - reference[index].value);
    if (gap > tolerance)
      throw new Error(
        `Frame ${index} is ${gap} ${unit} away from the reference (tolerance ${tolerance})`,
      );
  });
}
