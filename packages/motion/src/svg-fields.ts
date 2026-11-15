import type { MotionElement, VisualFrame } from './contract.js';


/** The elements that wrote a development warning about `draw`, once each. */
const warned = new WeakSet<Element>();
/** The `pathLength` each shape had before a motion drew it, given back by `restoreDraw`. */
const authorPathLength = new WeakMap<Element, string | null>();

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
 * says so), and a shape gets its `pathLength` set before its first frame is written.
 */
export function shapeFrames(frames: readonly VisualFrame[], target: MotionElement): VisualFrame[] {
  if (!frames.some(frame => frame.draw !== undefined)) return [...frames];
  if (!canDraw(target)) return frames.map(frame => { const copy = { ...frame }; delete copy.draw; return copy; });
  prepareDraw(target);
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

/** Give a shape that draws the `pathLength` of 1, so that its dashes are fractions. The author's value is kept for `restoreDraw`. */
export function prepareDraw(element: MotionElement): void {
  if (!canDraw(element) || authorPathLength.has(element)) return;
  authorPathLength.set(element, element.getAttribute('pathLength'));
  element.setAttribute('pathLength', '1');
}

/** Give a shape back the `pathLength` its author set, or none, as `prepareDraw` found it. */
export function restoreDraw(element: MotionElement): void {
  if (!authorPathLength.has(element)) return;
  const value = authorPathLength.get(element) ?? null;
  authorPathLength.delete(element);
  if (value === null) element.removeAttribute('pathLength');
  else element.setAttribute('pathLength', value);
}
