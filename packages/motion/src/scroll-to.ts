import type { SpringRef } from './motion-spec.js';
import { holdAnchor, releaseAnchor } from './anchor.js';
import { motionDisabledIn } from './motion-style.js';
import { getMotionRuntime, retainMotionRuntime } from './runtime.js';
import { stepSpring, type SpringState } from './spring-step.js';
import { springParams, type MotionScheme } from './tokens.js';

/** A scroll position in the units of `scrollLeft` and `scrollTop`: an axis that is not given does not move. */
export interface ScrollPosition {
  x?: number;
  y?: number;
}

/** The options of `scrollTo`: the container, the spring, an offset of the destination, and the focus at the end. */
export interface ScrollToOptions {
  /** The element that scrolls, or the window for the page; by default the nearest scrollable ancestor of the target, or the page. */
  container?: Element | Window;
  /** The spring of the scroll; `spring.slow.spatial` by default. */
  timing?: SpringRef;
  /** Pixels added to the destination on each axis, in scroll units: negative values stop before the target on a page read from the top. */
  offset?: ScrollPosition;
  /** Moves focus to the target element once it is there, without scrolling again. Default false. */
  focus?: boolean;
}

/** A scroll in progress: `finished` tells how it ended, and `cancel()` stops it where it is. */
export interface ScrollHandle {
  /** Resolves 'finished' at the destination, 'cancelled' when the user or `cancel()` stopped it. Never rejects. */
  readonly finished: Promise<'finished' | 'cancelled'>;
  /** Stops the scroll where it is; a scroll that has ended is not affected. */
  cancel(): void;
}

type Axis = 'x' | 'y';
type Side = 'top' | 'right' | 'bottom' | 'left';
type Point = { x: number; y: number };

const AXES: readonly Axis[] = ['x', 'y'];
/** The axis each side of a box lies along. */
const AXIS: Record<Side, Axis> = { top: 'y', bottom: 'y', left: 'x', right: 'x' };
/** The longest frame step integrated, in seconds, and the step of the first frame: as the gestures do. */
const MAX_FRAME = 1 / 30;
const FIRST_FRAME = 1 / 60;
/** A scroll is at rest within this many px of its destination, and moves slower than this many px/s. */
const REST_POSITION = 0.5;
const REST_VELOCITY = 0.5;
/** A position that moved more than this many px since the last write was moved by the user (a dragged scrollbar). */
const DRIFT = 2;
/** The events that give a running scroll to the user. */
const TAKEOVER = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
/** The overflow values of a scroll container. */
const SCROLLING = new Set(['auto', 'scroll', 'overlay', 'hidden']);
/** The elements that take focus without a tabindex. */
const FOCUSABLE = 'a[href],area[href],button,input:not([type="hidden"]),select,textarea,iframe,summary,[contenteditable]';
/** The scrolls in progress, by the element they scroll: a new scroll of an element cancels the one before it. */
const running = new WeakMap<Element, ScrollHandle>();

/** The element whose scroll position moves: the container, or the root element of the page, whose window is `page`. */
interface Scroller {
  readonly element: Element;
  readonly page: Window | undefined;
}

const styleOf = (el: Element): CSSStyleDeclaration => (el.ownerDocument.defaultView ?? window).getComputedStyle(el);

/** A length of a computed style, in px; a keyword such as `auto` counts as zero. */
const lengthOf = (style: CSSStyleDeclaration, property: string): number =>
  Number.parseFloat(style.getPropertyValue(property)) || 0;

/** The sides of the block-start and inline-start edges of a box laid out in the writing mode and direction of `style`. */
function startSides(style: CSSStyleDeclaration): { block: Side; inline: Side } {
  const mode = style.getPropertyValue('writing-mode');
  const rtl = style.getPropertyValue('direction') === 'rtl';
  if (!/^(vertical|sideways)/.test(mode)) return { block: 'top', inline: rtl ? 'right' : 'left' };
  return { block: mode.endsWith('lr') ? 'left' : 'right', inline: rtl ? 'bottom' : 'top' };
}

/** The nearest ancestor of `target` that scrolls and has something to scroll, or undefined when the page scrolls. */
function scrollParentOf(target: Element): Element | undefined {
  const { body, documentElement } = target.ownerDocument;
  for (let el = target.parentElement; el && el !== body && el !== documentElement; el = el.parentElement) {
    const style = styleOf(el);
    const scrolls = SCROLLING.has(style.overflowX) || SCROLLING.has(style.overflowY);
    if (scrolls && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) return el;
  }
  return undefined;
}

/** The scroller of a scroll: the container, or else the scrolling ancestor of an element, or else the page. */
function scrollerOf(target: Element | ScrollPosition, container: Element | Window | undefined): Scroller {
  if (container instanceof Element) return { element: container, page: undefined };
  const ancestor = container === undefined && target instanceof Element ? scrollParentOf(target) : undefined;
  if (ancestor) return { element: ancestor, page: undefined };
  const page = container ?? (target instanceof Element ? target.ownerDocument.defaultView : null) ?? window;
  return { element: page.document.scrollingElement ?? page.document.documentElement, page };
}

/** The area a scroller shows, as the edges of its box in viewport coordinates (the page shows the viewport). */
function portOf({ element, page }: Scroller): Record<Side, number> {
  if (page) return { top: 0, left: 0, right: element.clientWidth, bottom: element.clientHeight };
  const box = element.getBoundingClientRect();
  const top = box.top + element.clientTop;
  const left = box.left + element.clientLeft;
  return { top, left, right: left + element.clientWidth, bottom: top + element.clientHeight };
}

/** The scroll range of each axis: from zero to the overflow, or from minus the overflow to zero where the scroll starts at the end. */
function limitsOf(scroller: Scroller, style: CSSStyleDeclaration): Record<Axis, [number, number]> {
  const { element } = scroller;
  const { block, inline } = startSides(style);
  const spanX = Math.max(0, element.scrollWidth - element.clientWidth);
  const spanY = Math.max(0, element.scrollHeight - element.clientHeight);
  const sides: Side[] = [block, inline];
  return {
    x: sides.includes('right') ? [-spanX, 0] : [0, spanX],
    y: sides.includes('bottom') ? [-spanY, 0] : [0, spanY],
  };
}

/**
 * Where the scroller must be for the target's start edges to meet its port, past the scroll padding of the scroller and
 * the scroll margin of the target, plus the offset, within the scroll range. A position is taken as it is.
 */
function aim(scroller: Scroller, target: Element | ScrollPosition, offset: ScrollPosition): Point {
  const { element } = scroller;
  const style = styleOf(element);
  const at: Point = { x: element.scrollLeft, y: element.scrollTop };
  const to: Point = { ...at };
  const aimed: Record<Axis, boolean> = { x: true, y: true };
  if (target instanceof Element) {
    const { block, inline } = startSides(style);
    const port = portOf(scroller);
    const box = target.getBoundingClientRect();
    const margins = styleOf(target);
    for (const side of [block, inline]) {
      const axis = AXIS[side];
      // The edge of the port that the target's edge meets: the start edge pushed in by the padding and the margin.
      const inset = lengthOf(style, `scroll-padding-${side}`) + lengthOf(margins, `scroll-margin-${side}`);
      const meets = side === 'top' || side === 'left' ? port[side] + inset : port[side] - inset;
      // The content moves from where the target's edge is to where it meets: the scroll moves the other way.
      to[axis] = at[axis] + box[side] - meets;
    }
  } else {
    for (const axis of AXES) {
      const value = target[axis];
      aimed[axis] = value !== undefined;
      if (value !== undefined) to[axis] = value;
    }
  }
  const limits = limitsOf(scroller, style);
  for (const axis of AXES) {
    if (aimed[axis]) to[axis] += offset[axis] ?? 0;
    to[axis] = Math.min(limits[axis][1], Math.max(limits[axis][0], to[axis]));
  }
  return to;
}

/** The scheme of the document, which picks the spring of the scroll. */
const schemeOf = (element: Element): MotionScheme =>
  element.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';

/**
 * Where `scrollTo` would stop the same target with the same options, read now: the scroll position of each axis, in scroll
 * units, once the offset is added and the position is kept within the scroll range. Nothing scrolls.
 */
export function scrollDestination(
  target: Element | ScrollPosition,
  options: Pick<ScrollToOptions, 'container' | 'offset'> = {},
): Point {
  return aim(scrollerOf(target, options.container), target, options.offset ?? {});
}

/**
 * Scroll `container` (by default the nearest scrollable ancestor of an element, or the page) until `target` is at its start
 * edges, or to a position, over a spring. The destination is read on each frame, so the scroll follows the layout; the
 * wheel, a touch, a pointer press or a key press of the user cancels it; under reduced motion it jumps.
 */
export function scrollTo(target: Element | ScrollPosition, options: ScrollToOptions = {}): ScrollHandle {
  const scroller = scrollerOf(target, options.container);
  const { element } = scroller;
  const subject = target instanceof Element ? target : element;
  const offset = options.offset ?? {};
  const params = springParams(options.timing ?? 'spring.slow.spatial', schemeOf(element));
  const runtime = getMotionRuntime();
  running.get(element)?.cancel();
  const releaseRuntime = retainMotionRuntime(runtime);
  const listenTo = element.ownerDocument.defaultView ?? window;
  const limits = limitsOf(scroller, styleOf(element));
  // The axes that move: the ones that can scroll and that the target aims at.
  const moving = AXES.filter(axis => limits[axis][1] > limits[axis][0] && (target instanceof Element || target[axis] !== undefined));
  // The position the scroll last wrote: a position that moved away from it was moved by the user.
  const written: Point = { x: element.scrollLeft, y: element.scrollTop };
  // The springs keep their own position: the scroll reads back in whole pixels, and a rest band of half a pixel around a
  // fractional destination would then never be met.
  const springs: Record<Axis, SpringState> = { x: { x: written.x, v: 0 }, y: { x: written.y, v: 0 } };
  let settled = false;
  let frameAt: number | undefined;
  let unsubscribe: (() => void) | undefined;
  let unsubscribePolicy: (() => void) | undefined;
  let resolve!: (result: 'finished' | 'cancelled') => void;
  const finished = new Promise<'finished' | 'cancelled'>(done => {
    resolve = done;
  });
  const handle: ScrollHandle = { finished, cancel: () => end('cancelled') };
  const takeover = (): void => end('cancelled');
  // The anchoring of the scroller is held while the scroll runs, and given back at the end: the browser must not move the position itself.
  let held: HTMLElement | SVGElement | undefined;

  /** The end of the scroll: its listeners and subscriptions go, its lease on the runtime is given back, and it resolves. */
  function end(result: 'finished' | 'cancelled'): void {
    if (settled) return;
    settled = true;
    unsubscribe?.();
    unsubscribe = undefined;
    unsubscribePolicy?.();
    unsubscribePolicy = undefined;
    for (const type of TAKEOVER) listenTo.removeEventListener(type, takeover, { capture: true });
    if (held) releaseAnchor(held);
    if (running.get(element) === handle) running.delete(element);
    releaseRuntime();
    resolve(result);
  }

  /** Write the given axes of a position at once; the author's `scroll-behavior` does not animate it again. */
  function write(to: Point, axes: readonly Axis[]): void {
    const position: { left?: number; top?: number; behavior: ScrollBehavior } = { behavior: 'instant' };
    for (const axis of axes) {
      if (axis === 'x') position.left = to.x;
      else position.top = to.y;
    }
    if (scroller.page) scroller.page.scrollTo(position);
    else element.scrollTo(position);
  }

  /** Put the scroll at its destination and end it there; the focus of the target comes after the end. */
  function arrive(to: Point = aim(scroller, target, offset)): void {
    if (moving.length > 0) write(to, moving);
    end('finished');
    if (options.focus && target instanceof Element) {
      if (!target.hasAttribute('tabindex') && !target.matches(FOCUSABLE)) target.setAttribute('tabindex', '-1');
      if (target instanceof HTMLElement || target instanceof SVGElement) target.focus({ preventScroll: true });
    }
  }

  /** A frame of the scroll: each moving axis takes one step of its spring towards the destination read now. */
  function frame(now: number): void {
    const dt = frameAt === undefined ? FIRST_FRAME : Math.min(Math.max(now - frameAt, 0) / 1000, MAX_FRAME);
    frameAt = now;
    const read: Point = { x: element.scrollLeft, y: element.scrollTop };
    if (moving.some(axis => Math.abs(read[axis] - written[axis]) > DRIFT)) {
      end('cancelled');
      return;
    }
    const goal = aim(scroller, target, offset);
    if (dt > 0) for (const axis of moving) stepSpring(springs[axis], goal[axis], dt, params);
    const atRest = moving.every(axis =>
      Math.abs(springs[axis].x - goal[axis]) < REST_POSITION && Math.abs(springs[axis].v) < REST_VELOCITY);
    if (atRest) {
      arrive(goal);
      return;
    }
    // The spring may overshoot the scroll range: what is written is the position the browser holds, within the range.
    const range = limitsOf(scroller, styleOf(element));
    for (const axis of moving) written[axis] = Math.min(range[axis][1], Math.max(range[axis][0], springs[axis].x));
    write(written, moving);
  }

  running.set(element, handle);
  // Reduced motion, `--udx-motion: none`, or nothing that can scroll: the scroll is at its destination at once.
  if (runtime.policy.reduced || motionDisabledIn(styleOf(subject)) || moving.length === 0) {
    arrive();
    return handle;
  }
  for (const type of TAKEOVER) listenTo.addEventListener(type, takeover, { capture: true, passive: true });
  if (element instanceof HTMLElement || element instanceof SVGElement) {
    held = element;
    holdAnchor(element);
  }
  unsubscribePolicy = runtime.policy.subscribe(() => {
    if (runtime.policy.reduced) arrive();
  });
  unsubscribe = runtime.subscribe('scroll', { tick: frame }, { pauseWhenReduced: false });
  return handle;
}
