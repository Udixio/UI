import type { StyleKeyframe } from './keyframes.js';
import type { Contract } from './timing-plan.js';

/**
 * A reduced form (the model, §3.1.4): `fade` animates the opacity and sets the rest, `end` and `start` show the last or
 * the first keyframe at once, `none` writes nothing, and a keyframe is shown at once.
 */
export type ReducedForm = 'fade' | 'end' | 'start' | 'none' | StyleKeyframe;

/** Why a motion is reduced: the policy, `--udx-motion: none` on the element, or a scale of 0. */
export type ReducedCause = 'policy' | 'disabled' | 'zero-scale';

/**
 * What a reduced play writes: the opacity frames to animate on the effects spring (`null`: none), and the frame written at
 * once (`null`: none).
 */
export interface ReducedPlan {
  readonly fade: readonly StyleKeyframe[] | null;
  readonly set: StyleKeyframe | null;
}

const WORDS: ReadonlyMap<string, ReducedForm> = new Map<string, ReducedForm>([
  ['fade', 'fade'],
  ['end', 'end'],
  ['start', 'start'],
  ['none', 'none'],
  ['instant', 'end'],
  ['static', 'none'],
]);

/** The reduced form a word names (the old words `instant` and `static` included), or undefined. */
export function readReducedWord(word: string): ReducedForm | undefined {
  return WORDS.get(word);
}

const NOTHING: ReducedPlan = { fade: null, set: null };

/** Whether a frame writes a value of opacity. */
const hasOpacity = (frame: StyleKeyframe): boolean =>
  frame.opacity !== undefined && frame.opacity !== null;

/** The frame without its opacity and its offset, or null when nothing else is left. */
function restOf(frame: StyleKeyframe): StyleKeyframe | null {
  const entries = Object.entries(frame).filter(
    ([key, value]) => key !== 'opacity' && key !== 'offset' && value !== null,
  );
  return entries.length > 0
    ? (Object.fromEntries(entries) as StyleKeyframe)
    : null;
}

/** The opacity of a frame, at its offset when it has one. */
function opacityFrame(frame: StyleKeyframe): StyleKeyframe {
  return frame.offset === undefined
    ? { opacity: frame.opacity }
    : { opacity: frame.opacity, offset: frame.offset };
}

/** The opacity frames of a motion, offsets kept, or null when it has none. */
function opacityOf(frames: readonly StyleKeyframe[]): StyleKeyframe[] | null {
  const opacity = frames.filter(hasOpacity).map(opacityFrame);
  return opacity.length > 0 ? opacity : null;
}

/**
 * What a motion shows under a reduced cause, for one phase and one contract. `fade` is `end` under `disabled` and
 * `zero-scale`, and `none` under a driver; `start` is `none` under a state. Under a state, `fade` animates the opacity
 * of the held frame and sets the rest, in both phases; under an event, only opacity animates, and an exit keeps the rest.
 * On a state's exit the frames returned are read for their keys only, not their values: the registry hands back what it holds.
 */
export function reducedPlan(
  frames: readonly StyleKeyframe[],
  form: ReducedForm,
  request: { contract: Contract; phase: 'enter' | 'exit'; cause: ReducedCause },
): ReducedPlan {
  const last = frames[frames.length - 1];
  if (typeof form !== 'string') return { fade: null, set: form };
  if (form === 'none') return NOTHING;
  if (form === 'fade' && request.contract === 'driver') return NOTHING;
  if (form === 'start' && request.contract === 'state') return NOTHING;
  const effective =
    form === 'fade' && request.cause !== 'policy' ? 'end' : form;
  if (effective === 'end') return { fade: null, set: last };
  if (effective === 'start') return { fade: null, set: frames[0] };
  if (request.contract === 'state')
    return {
      fade: hasOpacity(last) ? [opacityFrame(last)] : null,
      set: restOf(last),
    };
  if (request.phase === 'exit')
    return {
      fade: opacityOf(frames) ?? [{ opacity: 1 }, { opacity: 0 }],
      set: null,
    };
  return {
    fade: opacityOf(frames) ?? [{ opacity: 0 }, { opacity: 1 }],
    set: restOf(last),
  };
}
