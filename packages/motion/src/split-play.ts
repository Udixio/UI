import { composeHandles } from './compose.js';
import type { MotionHandle, VisualFrame } from './contract.js';
import type { MotionSpec } from './define-motion.js';
import { applyFrame, motionDisabled, playMotion, releaseFrame } from './play.js';
import type { MotionRuntime } from './runtime.js';
import { staggerCap, staggerDelay, staggerStep } from './stagger.js';
import { getSplit, splitText } from './text.js';

// The split of a definition: its entry plays on the pieces of an element's text. It lives in the text module, which the
// main entry loads on demand; the main entry reaches it through the functions the text module provides.

/** A definition that may split the text of its element: every verb but layout, which has no keyframes to cut. */
type Splitting = Readonly<Exclude<MotionSpec, { verb: 'layout' }>>;
type PlayOptions = Parameters<typeof playMotion>[2];
type Origin = 'first' | 'last' | 'center';

/** The visual fields a definition writes on its element: its keyframes' fields, and opacity for a presence verb. */
function writtenFields(spec: Splitting): Set<keyof VisualFrame> {
  const fields = new Set<keyof VisualFrame>(spec.keyframes.flatMap(frame => Object.keys(frame) as (keyof VisualFrame)[]));
  if (spec.verb === 'appear' || spec.verb === 'disappear') fields.add('opacity');
  return fields;
}

/** Release the frames that the pieces of an earlier split hold, so that the element is played whole without them. */
function releasePieces(target: HTMLElement, spec: Splitting): void {
  const split = getSplit(target);
  if (split) for (const piece of split.pieces) releaseFrame(piece, writtenFields(spec));
}

/** Rank of each piece of a text in text order, counted from `origin`: the pieces at the origin come first. */
export function textRanks(count: number, origin: Origin): number[] {
  return Array.from({ length: count }, (_, index) => {
    if (origin === 'last') return count - 1 - index;
    if (origin === 'center') return Math.round(Math.abs(index - (count - 1) / 2));
    return index;
  });
}

/**
 * The pieces of the text of an element that a definition plays, or undefined when the element is played whole: the
 * definition does not split, motion is reduced or turned off, or the text cannot split.
 */
export function splitPieces(target: HTMLElement, spec: Splitting, runtime: MotionRuntime): readonly HTMLElement[] | undefined {
  if (spec.split === undefined || runtime.policy.reduced || motionDisabled(target)) return undefined;
  return splitText(target, { by: spec.split })?.pieces;
}

/** Play a definition on the pieces of its element's text in a cascade, or on the element whole when it cannot split. */
export function playSplit(target: HTMLElement, spec: Splitting, options: PlayOptions): MotionHandle {
  const pieces = splitPieces(target, spec, options.runtime);
  if (pieces === undefined) {
    releasePieces(target, spec);
    return playMotion(target, spec, options);
  }
  // The cascade is the definition's `stagger` (`tight` by default), counted from its `origin`.
  // A frame the element holds, written before its text was split, would hide the pieces: they take the frame instead.
  releaseFrame(target, writtenFields(spec));
  const style = (target.ownerDocument.defaultView ?? window).getComputedStyle(target);
  const step = staggerStep(style, spec.stagger ?? 'tight');
  const cap = staggerCap(style);
  const ranks = textRanks(pieces.length, spec.origin ?? 'first');
  return composeHandles(
    pieces.map((piece, index) =>
      playMotion(piece, spec, { ...options, delay: (options.delay ?? 0) + staggerDelay(ranks[index], step, cap) }),
    ),
  );
}

/** Write a frame on each piece of the text of an element, or on the element itself when its text does not split. */
export function applySplitFrame(target: HTMLElement, spec: Splitting, runtime: MotionRuntime, frame: VisualFrame): void {
  if (spec.split === undefined) {
    applyFrame(target, frame);
    return;
  }
  const pieces = splitPieces(target, spec, runtime);
  if (pieces === undefined) {
    releasePieces(target, spec);
    applyFrame(target, frame);
    return;
  }
  releaseFrame(target, writtenFields(spec));
  for (const piece of pieces) applyFrame(piece, frame);
}

/** Put the text of an element back as it was, releasing the frames of its pieces; a text that is not split is left alone. */
export function revertSplit(target: HTMLElement, spec: Splitting): void {
  const split = spec.split === undefined ? undefined : getSplit(target);
  if (!split) return;
  for (const piece of split.pieces) releaseFrame(piece, writtenFields(spec));
  split.revert();
}
