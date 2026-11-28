import { composeHandles } from './compose.js';
import type { MotionElement, MotionHandle, VisualFrame } from './contract.js';
import { kindOf, type LegacySpec } from './define-motion.js';
import { applyRestingFrame, motionDisabled, paintFrame, playMotion, releaseOwned } from './play.js';
import type { MotionRuntime } from './runtime.js';
import { staggerCap, staggerDelay, staggerStep } from './stagger.js';
import { isHtmlElement } from './svg-fields.js';
import { getSplit, splitText } from './text.js';

// The split of a definition: its entry plays on the pieces of an element's text. It lives in the text module, which the
// main entry loads on demand; the main entry reaches it through the functions the text module provides.

/** A definition that may split the text of its element: every verb but layout, which has no keyframes to cut. */
type Splitting = Readonly<Exclude<LegacySpec, { verb: 'layout' }>>;
type PlayOptions = Parameters<typeof playMotion>[2];
type Origin = 'first' | 'last' | 'center';

/** The SVG elements that were warned about a split they cannot take, once each. */
const warned = new WeakSet<Element>();

/** The visual fields a definition writes on its element: its keyframes' fields, and opacity for a presence verb. */
function writtenFields(spec: Splitting): Set<keyof VisualFrame> {
  const fields = new Set<keyof VisualFrame>(spec.keyframes.flatMap(frame => Object.keys(frame) as (keyof VisualFrame)[]));
  if (spec.verb === 'appear' || spec.verb === 'disappear') fields.add('opacity');
  return fields;
}

/** Release the frames that the pieces of an earlier split hold, so that the element is played whole without them. */
function releasePieces(target: MotionElement, spec: Splitting): void {
  if (!isHtmlElement(target)) return;
  const split = getSplit(target);
  if (split) for (const piece of split.pieces) releaseOwned(piece, writtenFields(spec), kindOf(spec.verb));
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
 * definition does not split, motion is reduced or turned off, the element is an SVG element (its text is not split), or
 * the text cannot split.
 */
export function splitPieces(target: MotionElement, spec: Splitting, runtime: MotionRuntime): readonly HTMLElement[] | undefined {
  if (spec.split === undefined || runtime.policy.reduced || motionDisabled(target)) return undefined;
  if (!isHtmlElement(target)) {
    if (__MOTION_CHECKS__ && !warned.has(target)) {
      warned.add(target);
      console.warn(`[@udixio/motion] split applies to HTML text: the <${target.localName}> plays whole.`);
    }
    return undefined;
  }
  return splitText(target, { by: spec.split })?.pieces;
}

/** Play a definition on the pieces of its element's text in a cascade, or on the element whole when it cannot split. */
export function playSplit(target: MotionElement, spec: Splitting, options: PlayOptions): MotionHandle {
  const pieces = splitPieces(target, spec, options.runtime);
  if (pieces === undefined) {
    releasePieces(target, spec);
    return playMotion(target, spec, options);
  }
  // The cascade is the definition's `stagger` (`tight` by default), counted from its `origin`.
  // A frame the element holds, written before its text was split, would hide the pieces: they take the frame instead.
  releaseOwned(target, writtenFields(spec), kindOf(spec.verb));
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

/**
 * Write a frame on each piece of the text of an element, or on the element itself when its text does not split. A resting
 * frame releases its neutral fields on each of them (`applyRestingFrame`).
 */
export function applySplitFrame(target: MotionElement, spec: Splitting, runtime: MotionRuntime, frame: VisualFrame, resting = false): void {
  const owner = kindOf(spec.verb);
  const write = (element: MotionElement) => (resting ? applyRestingFrame(element, frame, owner) : paintFrame(element, frame, owner));
  if (spec.split === undefined) {
    write(target);
    return;
  }
  const pieces = splitPieces(target, spec, runtime);
  if (pieces === undefined) {
    releasePieces(target, spec);
    write(target);
    return;
  }
  releaseOwned(target, writtenFields(spec), owner);
  for (const piece of pieces) write(piece);
}

/** Put the text of an element back as it was, releasing the frames of its pieces; a text that is not split is left alone. */
export function revertSplit(target: MotionElement, spec: Splitting): void {
  const split = spec.split === undefined || !isHtmlElement(target) ? undefined : getSplit(target);
  if (!split) return;
  for (const piece of split.pieces) releaseOwned(piece, writtenFields(spec), kindOf(spec.verb));
  split.revert();
}
