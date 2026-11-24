import type { MotionElement } from './contract.js';

/**
 * Whether an element is declared with no box, so that its motion goes to its box. Three signals, all read
 * without the computed style: its own style says `display: contents` (`style="display: contents"`); the binding says so
 * (`boxless: true`, what an adapter passes for a host it knows); or it carries `data-motion-box="child"` (React's
 * `<Motion as={Component}>` wrapper, a Udixio Angular host, HTML, a third-party wrapper). An element that is
 * `display: contents` by a stylesheet only is not declared: it is its own box, and development says to declare it. A declared
 * element carries the state (`hidden`, `data-motion-presence`, `inert`); its box carries the pixels.
 * @param element - The element a motion is bound to.
 * @param boxless - The `boxless` option of the binding.
 * @returns True when the element is declared with no box.
 */
export function hasNoBox(element: Element, boxless = false): boolean {
  const declared = element.getAttribute('data-motion-box');
  // An element with no box to give is not a delegation: it is where `motion()` stops, and binds nothing.
  if (declared === 'none') return false;
  if (boxless || declared === 'child') return true;
  // The style attribute first: reading `style` makes the element's style object, which most elements never need.
  return element.getAttribute('style')?.includes('contents') === true && (element as MotionElement).style.display === 'contents';
}

/**
 * The element a motion of `target` moves, its box: `target` itself, or, when it is declared with no box
 * (`hasNoBox`), its direct child marked `data-motion-box`, else its first element child, by the same rule again. A
 * declared element with no child is its own box.
 *
 * `data-motion-box` is one vocabulary: on the element, `"child"` says "my box is a child"; on a child of an element with no
 * box, the attribute (empty, or any other value) says "this is the box". The marker is read only on a direct child of an element
 * with no box. `"none"` says "I have no box to give": a component whose surface is in a portal or the top layer. The walk
 * stops there, and `motion()` binds nothing on it (development points to the component's own `motion` prop).
 *
 * Production reads no computed style. Development checks two things, once per element: an element with no box and several
 * element children, none marked ("several children: mark the box with data-motion-box"), and an element that is
 * `display: contents` by a stylesheet but not declared ("has no box (display: contents): declare it so its motion goes to its
 * box").
 *
 * Known limit: the signals are read when the motion is bound. A display that changes afterwards (a class such as `md:contents`
 * that applies at another width) is not followed: bind the element again.
 * @param target - The element a motion is bound to.
 * @param boxless - The `boxless` option of the binding: the element is declared with no box.
 * @returns The element the motion animates.
 */
export function motionBox(target: MotionElement, boxless = false): MotionElement {
  let box = target;
  let declared = boxless;
  while (hasNoBox(box, declared)) {
    declared = false;
    const marked = box.querySelector(':scope > [data-motion-box]');
    const next = marked ?? box.firstElementChild;
    if (!next) return box;
    if (__MOTION_CHECKS__ && !marked && next.nextElementSibling && !reportedBoxes.has(box)) {
      reportedBoxes.add(box);
      console.warn(
        `[@udixio/motion] ${elementLabel(box)} has no box (display: contents) and several children: mark the box with data-motion-box. Its motion goes to its first element child, ${elementLabel(next)}.`,
        box,
      );
    }
    box = next as MotionElement;
  }
  if (__MOTION_CHECKS__ && !reportedUndeclared.has(box) && box.getAttribute('data-motion-box') !== 'none' && getComputedStyle(box).display === 'contents') {
    reportedUndeclared.add(box);
    console.warn(
      `[@udixio/motion] ${elementLabel(box)} has no box (display: contents): declare it so its motion goes to its box (data-motion-box="child" on it, or the boxless option).`,
      box,
    );
  }
  return box;
}

/** The elements reported in development for display: contents from a stylesheet, not declared: once per element. */
const reportedUndeclared = new WeakSet<Element>();

/** The elements with no box reported in development for several children, none marked: once per element. */
const reportedBoxes = new WeakSet<Element>();

/**
 * The key of the static by which a component tells a wrapper that renders it what its box is, without the wrapper importing
 * it: `Tooltip[MOTION_BOX] = 'none'`, or a function of its props (`(props) => props.variant === 'modal' ? 'none' : undefined`).
 * `'none'` is the value of `data-motion-box`: React's `<Motion as={Tooltip}>` renders its wrapper with
 * `data-motion-box="none"`, so that `motion()` binds nothing there. It is `Symbol.for('udixio.motion.box')`, the same in every
 * copy of the package.
 */
export const MOTION_BOX = Symbol.for('udixio.motion.box');

/** What a component declares under `MOTION_BOX`: `'none'` when it has no box to give, or a function of its props that says so. */
export type MotionBoxDeclaration = 'none' | ((props: Record<string, unknown>) => 'none' | undefined);

/** An element as a development message names it: its tag, its id and its first classes. */
export function elementLabel(element: Element): string {
  const id = element.id ? `#${element.id}` : '';
  const classes = Array.from(element.classList.values()).slice(0, 3).map(name => `.${name}`).join('');
  return `<${element.localName}${id}${classes}>`;
}
