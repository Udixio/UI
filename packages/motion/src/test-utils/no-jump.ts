/** One value read at one animation frame; `t` is the frame's timestamp in milliseconds. */
export type Sample = { readonly t: number; readonly value: number };

/**
 * The constants of the "no jump" check (spec §7). A step between two frames may move by at most `ratio` times the largest step of
 * the two before it, and never by less than its floor (1 px, or 0.004 of a scale). The reference tolerances apply when a reference
 * run is given.
 */
export const NO_JUMP = {
  ratio: 1.5,
  floorPx: 1,
  floorScale: 0.004,
  referencePx: 1,
  referenceScale: 0.004,
} as const;

/** One step between consecutive samples: the frame it lands on, its size, the largest step before it, and its bound. */
type Step = {
  readonly index: number;
  readonly move: number;
  readonly history: number;
  readonly bound: number;
};

/** Resolves at the timestamp of the next animation frame. */
function nextFrame(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

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

/** Every step of the samples, with the bound of the criterion; the first step has no history. */
function stepsOf(samples: readonly Sample[], unit: 'px' | 'scale'): Step[] {
  const floor = unit === 'px' ? NO_JUMP.floorPx : NO_JUMP.floorScale;
  const moves = samples
    .slice(1)
    .map((sample, i) => sample.value - samples[i].value);
  return moves.map((move, i) => {
    const history = Math.max(
      0,
      i >= 1 ? Math.abs(moves[i - 1]) : 0,
      i >= 2 ? Math.abs(moves[i - 2]) : 0,
    );
    return {
      index: i + 1,
      move: Math.abs(move),
      history,
      bound: Math.max(NO_JUMP.ratio * history, floor),
    };
  });
}

/** The first frame whose step exceeds the criterion, with the size of that step, or null when the samples show no jump. */
export function findJump(
  samples: readonly Sample[],
  unit: 'px' | 'scale',
): { index: number; move: number } | null {
  const step = stepsOf(samples, unit).find(
    (candidate) => candidate.move > candidate.bound,
  );
  return step === undefined ? null : { index: step.index, move: step.move };
}

/** The largest step, and the largest ratio of a step to the largest step before it (steps from rest have no ratio). */
export function jumpStats(samples: readonly Sample[]): {
  maxMove: number;
  maxRatio: number;
} {
  const steps = stepsOf(samples, 'scale');
  const maxMove = Math.max(0, ...steps.map((step) => step.move));
  const maxRatio = Math.max(
    0,
    ...steps
      .filter((step) => step.history > 0)
      .map((step) => step.move / step.history),
  );
  return { maxMove, maxRatio };
}

/**
 * Throws an `Error` naming the frame when the samples jump. Without `reference`, the criterion of `NO_JUMP` applies. With
 * `reference` (the same transition on a twin element, sampled in the same task), each frame must be within the reference
 * tolerance of its counterpart.
 */
export function expectNoJump(
  samples: readonly Sample[],
  unit: 'px' | 'scale',
  reference?: readonly Sample[],
): void {
  if (reference !== undefined) {
    if (reference.length !== samples.length)
      throw new Error(
        `The reference has ${reference.length} frames, the transition ${samples.length}`,
      );
    const tolerance =
      unit === 'px' ? NO_JUMP.referencePx : NO_JUMP.referenceScale;
    samples.forEach((sample, index) => {
      const gap = Math.abs(sample.value - reference[index].value);
      if (gap > tolerance)
        throw new Error(
          `Frame ${index} is ${gap} ${unit} away from the reference (tolerance ${tolerance})`,
        );
    });
    return;
  }
  const jump = findJump(samples, unit);
  if (jump !== null)
    throw new Error(
      `No jump expected: the value moves by ${jump.move} ${unit} at frame ${jump.index}`,
    );
}
