import type { MotionElement, VisualFrame } from './contract.js';
import type { MotionKind } from './define-motion.js';

/** The owner of a draw: the kind of the motion that draws the shape, or `external` for a direct call of `prepareDraw`. */
export type DrawOwner = MotionKind | 'external';

/** The elements that wrote a development warning about `draw`, once each. */
const warned = new WeakSet<Element>();
/** The `pathLength` each shape had before a motion drew it, given back when its last owner gives the draw back. */
const authorPathLength = new WeakMap<Element, string | null>();
/** The owners that draw each shape now: its `pathLength` is the author's only when this set is empty. */
const drawers = new WeakMap<Element, Set<DrawOwner>>();

/** Whether an element is an HTML element: layout, gestures, values and text splits apply to HTML elements only. */
export function isHtmlElement(element: Element): element is HTMLElement {
  return element.namespaceURI === 'http://www.w3.org/1999/xhtml';
}

/** Whether `draw` applies to an element: a path or a basic shape. Another element keeps its stroke, with a development warning once. */
export function canDraw(element: Element): boolean {
  if (element instanceof (element.ownerDocument.defaultView ?? window).SVGGeometryElement) return true;
  if (process.env.NODE_ENV !== 'production' && !warned.has(element)) {
    warned.add(element);
    console.warn(`[@udixio/motion] draw applies to a path or a basic shape: the <${element.localName}> keeps its stroke.`);
  }
  return false;
}

/**
 * The frames a motion writes on `target`: a `draw` is dropped from them when the target is no shape (a development warning
 * says so), and a shape gets its `pathLength` set, for `owner`, before its first frame is written.
 */
export function shapeFrames(frames: readonly VisualFrame[], target: MotionElement, owner: DrawOwner = 'external'): VisualFrame[] {
  if (!frames.some(frame => frame.draw !== undefined)) return [...frames];
  if (!canDraw(target)) return frames.map(frame => { const copy = { ...frame }; delete copy.draw; return copy; });
  prepareDraw(target, owner);
  return [...frames];
}

/** The dash of a shape whose `pathLength` is 1: a dash of the whole length, shifted out of view as `draw` falls to 0. */
export function drawStyle(draw: number): { strokeDasharray: string; strokeDashoffset: string } {
  return { strokeDasharray: '1', strokeDashoffset: String(1 - draw) };
}

/** The position of an element on its `offset-path`, as a percentage of the path. */
export function alongDistance(along: number): string {
  return `${along * 100}%`;
}

/**
 * Give a shape that draws the `pathLength` of 1, so that its dashes are fractions, for `owner`. The author's value is kept
 * while any owner draws the shape: each owner is counted once, so a motion may call this as often as it writes a frame.
 */
export function prepareDraw(element: MotionElement, owner: DrawOwner = 'external'): void {
  if (!canDraw(element)) return;
  let owners = drawers.get(element);
  if (!owners) drawers.set(element, (owners = new Set()));
  owners.add(owner);
  if (authorPathLength.has(element)) return;
  authorPathLength.set(element, element.getAttribute('pathLength'));
  element.setAttribute('pathLength', '1');
}

/**
 * Give back what `owner` draws on a shape. The `pathLength` the author set comes back, or none, as `prepareDraw` found it,
 * once no owner draws the shape: a shape that another motion still draws keeps its `pathLength` of 1.
 */
export function restoreDraw(element: MotionElement, owner: DrawOwner = 'external'): void {
  const owners = drawers.get(element);
  if (owners) {
    owners.delete(owner);
    if (owners.size > 0) return;
    drawers.delete(element);
  }
  if (!authorPathLength.has(element)) return;
  const value = authorPathLength.get(element) ?? null;
  authorPathLength.delete(element);
  if (value === null) element.removeAttribute('pathLength');
  else element.setAttribute('pathLength', value);
}

/**
 * Give back the draw of `owner` on a shape: its dash, unless another owner still draws the shape (the dash is shared, the
 * last one written stays), then its `pathLength` through `restoreDraw`.
 */
export function releaseDraw(element: MotionElement, owner: DrawOwner): void {
  const others = [...(drawers.get(element) ?? [])].some(other => other !== owner);
  if (!others) {
    element.style.removeProperty('stroke-dasharray');
    element.style.removeProperty('stroke-dashoffset');
  }
  restoreDraw(element, owner);
}
