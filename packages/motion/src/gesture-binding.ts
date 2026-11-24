import { motionBox } from './box.js';
import { provideGestures } from './feature-loader.js';
import { moveFocusTo } from './focus.js';
import { DEFAULT_AXIS, DEFAULT_GESTURE_TIMING, type GestureType, type GestureRef, type GestureSpec } from './gesture.js';
import { motionDisabled } from './play.js';
import { resolveGesture } from './registries.js';
import { getMotionRuntime, retainMotionRuntime, type MotionRuntime } from './runtime.js';
import { stepSpring, type SpringState } from './spring-step.js';
import { springParams, type MotionScheme } from './tokens.js';
import { VISUALLY_HIDDEN } from './visually-hidden.js';

/** A gesture bound to an element: its offset, its last measured velocity, and the means to put it back. */
export interface GestureBinding {
  /** The name of the bound gesture. */
  readonly name: string;
  /** The type of the gesture: `drag`, `swipe` or `reorder`. */
  readonly type: GestureType;
  /** Current offset written as `translate`, in px. */
  readonly offset: { x: number; y: number };
  /** Last measured velocity, px/s. */
  readonly velocity: { x: number; y: number; source: 'estimated' };
  /** Put the element back at offset 0 (and visible), with the release spring. */
  reset(): void;
  /** Unbind the gesture and give back the `translate`, `opacity` and `touch-action` it wrote. */
  destroy(): void;
}

type Axis = 'x' | 'y' | 'both';
type Point = { x: number; y: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Sample = { t: number; x: number; y: number };
/** A pointer that holds the element: where it started, the offset it started from, and the bounds read at grab. */
interface Grab {
  readonly id: number;
  readonly startX: number;
  readonly startY: number;
  readonly base: Point;
  /** Where the pointer puts the element: the offset it would have with no reorder. */
  raw: Point;
  readonly bounds: Bounds | undefined;
  /** The inline user-select the element had before the grab, given back at its end. */
  readonly userSelect: string;
}

/** The longest frame step that is integrated, in seconds: a frame after a pause moves the spring at most this far. */
const MAX_FRAME = 1 / 30;
/** The time the first frame of a motion integrates: the change came during the frame before, so the motion starts on the next one. */
const FIRST_FRAME = 1 / 60;
/** A release is at rest when it is this close to its goal, in px, and moves this slowly, in px/s. */
const REST_POSITION = 0.05;
const REST_VELOCITY = 0.5;
/** The velocity is measured over the newest samples of the last 100 ms, at most five of them. */
const SAMPLE_WINDOW = 100;
const SAMPLE_COUNT = 5;
/** A dragged element is thrown ahead by its release velocity over this many seconds. */
const THROW_TIME = 0.2;
/** An arrow key moves a drag 16 px, or 64 px with Shift. */
const NUDGE = 16;
const NUDGE_LARGE = 64;
/** A swipe flies out past 40 % of its size or at more than 800 px/s, and stops 32 px beyond its size. */
const SWIPE_RATIO = 0.4;
const SWIPE_SPEED = 800;
const SWIPE_MARGIN = 32;
/** The arrow keys that move a drag, with the direction each one moves it in. */
const ARROWS = new Map<string, [number, number]>([
  ['ArrowLeft', [-1, 0]],
  ['ArrowRight', [1, 0]],
  ['ArrowUp', [0, -1]],
  ['ArrowDown', [0, 1]],
]);

/** The options of `gesture()`. */
export interface GestureOptions {
  /**
   * Report a reorder bound on an element with no parent.
   * @defaultValue false
   */
  development?: boolean;
  /**
   * Where focus goes when a swipe flies out with focus inside the element (WCAG 2.4.3): an element, or a function that gives
   * one when the fly-out starts; `false` leaves focus where it is. Without one, or when the function gives none, focus moves
   * to the next sibling that carries the same gesture, else the previous one, else the parent.
   */
  restoreFocus?: Element | false | (() => Element | false | null | undefined);
  /**
   * The element has no box (`display: contents`, from a stylesheet): the gesture moves its box (`motionBox`). What an adapter
   * passes for a host it knows. An element whose own style says `display: contents`, or that carries
   * `data-motion-box="child"`, needs no option.
   * @defaultValue false
   */
  boxless?: boolean;
}

/** The gesture bound on each element, found from the host and from its box: an element carries one at a time. */
const bindings = new WeakMap<Element, GestureBinding>();
/** The box each bound host moves: the host itself, unless it is declared with no box. */
const boxes = new WeakMap<Element, HTMLElement>();
/** The swiped elements on their way out, or flown out and hidden: focus does not move to them. */
const flown = new WeakSet<Element>();
/** The live region of reorder announcements: one for every reorder binding, present while one is bound. */
let live: HTMLElement | undefined;
let liveHolders = 0;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const round = (value: number, scale = 1000) => Math.round(value * scale) / scale;
const pixels = (value: string) => Number.parseFloat(value) || 0;
const schemeOf = (target: HTMLElement): MotionScheme =>
  target.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';
/** Whether the text of an element runs right to left: its computed direction, which an ancestor's `dir` sets. */
const rightToLeft = (el: Element): boolean => getComputedStyle(el).direction === 'rtl';

/**
 * The gesture bound on an element, if any.
 * @param target - The element.
 * @returns Its gesture binding, or undefined.
 */
export function getGesture(target: Element): GestureBinding | undefined {
  return bindings.get(target);
}

/**
 * Bind a gesture to an element. It moves the element with the pointer and gives it a keyboard alternative. While it is
 * bound, the element's touch-action leaves to the browser only the pan the gesture does not use. The arrows of a drag
 * move it physically, and in right-to-left text the arrows of a reorder on x follow the reading direction. The element
 * carries one gesture at a time: binding another one destroys the previous one. The gesture writes the element's `translate` (and
 * `opacity` while a swipe flies out), so an author's own `translate` on that element is overwritten while it is bound.
 * A swipe that flies out with focus inside the element moves focus when it starts, before the element is hidden or removed:
 * to `restoreFocus`, else to the next sibling with the same gesture, else the previous one, else the parent. The
 * `development` option only reports a reorder bound on an element with no parent.
 *
 * An element declared with no box (`hasNoBox`) carries the state and gives the pixels to its box (`motionBox`): the listeners,
 * `touch-action`, the keyboard alternative's `tabindex`, focus and the written `translate` and `opacity` go to its box; the
 * element stays the one that is moved in its list, removed, hidden from assistive technology after a swipe, and that the
 * events are dispatched on. Its neighbours in a reorder are measured by their boxes.
 * @param target - The element that is dragged, swiped or reordered, or an element declared with no box, whose box moves.
 * @param source - A gesture definition, or the name of a defined gesture.
 * @param options - `development` reports a reorder bound on an element with no parent; `restoreFocus` is where a swipe sends focus;
 *   `boxless` declares the element with no box.
 * @returns The binding: `offset`, `velocity`, `reset`, `destroy`.
 */
export function gesture(target: HTMLElement, source: GestureRef | string, options: GestureOptions = {}): GestureBinding {
  const ref = typeof source === 'string' ? resolveGesture(source) : source;
  if (!ref) throw new Error(`Unknown gesture "${typeof source === 'string' ? source : source.name}"`);
  bindings.get(target)?.destroy();
  const box = motionBox(target, options.boxless) as HTMLElement;
  if (box !== target) bindings.get(box)?.destroy();
  const binding = createBinding(target, box, ref, options);
  bindings.set(target, binding);
  bindings.set(box, binding);
  boxes.set(target, box);
  return binding;
}

/** Hold the shared live region: the first holder creates it, and the last one to let go removes it. */
function holdLive(doc: Document): () => void {
  liveHolders++;
  if (!live) {
    live = doc.createElement('div');
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('data-udx-motion-live', '');
    live.style.cssText = VISUALLY_HIDDEN;
    doc.body.append(live);
  }
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    if (--liveHolders === 0) {
      live?.remove();
      live = undefined;
    }
  };
}

/** Say a keyboard step to assistive technology, in the live region. */
function announce(text: string): void {
  if (live) live.textContent = text;
}

/**
 * A gesture: `host` is the element the author bound, which is moved in its list, removed, hidden from assistive technology, and
 * dispatches the events; `target`, its box, takes the pointer and the keyboard and is drawn moved. They are one element unless
 * the host is declared with no box.
 */
function createBinding(host: HTMLElement, target: HTMLElement, ref: GestureRef, options: GestureOptions): GestureBinding {
  const development = options.development ?? false;
  const { name } = ref;
  const spec: Readonly<GestureSpec> = ref.spec;
  const gestureType = spec.type;
  const axis: Axis = spec.axis ?? DEFAULT_AXIS[gestureType];
  const useX = axis !== 'y';
  const useY = axis !== 'x';
  const bounded = spec.type === 'drag' && spec.bounds !== 'none';
  const params = springParams(spec.timing ?? DEFAULT_GESTURE_TIMING, schemeOf(target));
  const runtime: MotionRuntime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const releaseLive = gestureType === 'reorder' ? holdLive(target.ownerDocument) : undefined;
  // The touch-action of the axis, written when the gesture is bound: the browser decides to pan when a touch starts, which
  // is before any pointerdown. The inline value the element had is given back on destroy.
  const touchAction = axis === 'both' ? 'none' : axis === 'x' ? 'pan-y' : 'pan-x';
  const previousTouchAction = target.style.touchAction;

  let destroyed = false;
  // The offset is the position of each release spring, in px, and its velocity in px/s. A pointer or a key sets it directly.
  const springs: { x: SpringState; y: SpringState } = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
  // Where the release springs are going, per axis.
  const goal: Point = { x: 0, y: 0 };
  // The last measured velocity, in px/s.
  let measured: Point = { x: 0, y: 0 };
  let samples: Sample[] = [];
  let unsubscribe: (() => void) | undefined;
  let frameAt: number | undefined;
  // What runs once the release comes to rest; a stopped release drops it.
  let settled: (() => void) | undefined;
  // True while the release is a drag's and its motion-dragend is what runs once it rests: a keyboard move owes that event too.
  let dragEndDue = false;
  // The distance over which a swipe fades while it flies out, and while it comes back: undefined when it is not faded.
  let fade: number | undefined;
  let grab: Grab | undefined;
  // The index a keyboard grab started from; undefined while no keyboard grab holds the element.
  let origin: number | undefined;
  // A reorder a listener refused: it is not asked again while the pointer stays past the same neighbour.
  let refused: Element | undefined;
  // The px that DOM reorders moved the element's rest place by during a pointer grab: its offset is the pointer's, less this.
  let shift = 0;
  // True while the element is moved in the DOM, when losing focus is not a leave.
  let reordering = false;
  let tabindexAdded = false;
  let translated = false;
  // The aria-hidden the author had before a swipe hid the element; undefined while the gesture has not set one.
  let ariaHidden: string | null | undefined;

  // Whether a swipe takes the element out of the DOM once it has flown out, rather than hiding it.
  const removeFlown = spec.type === 'swipe' && spec.afterFlyOut === 'remove';

  const holding = (): boolean => grab !== undefined || origin !== undefined;
  /** Whether a release is written at once rather than moved to: reduced motion, or `--udx-motion: none`. */
  const immediate = (): boolean => runtime.policy.reduced || motionDisabled(target);

  /** Write the offset as `translate`, and the fade of a swipe as its opacity. */
  function write(): void {
    translated = true;
    target.style.translate = `${round(springs.x.x)}px ${round(springs.y.x)}px`;
    if (fade !== undefined) {
      const along = axis === 'y' ? springs.y.x : springs.x.x;
      target.style.opacity = String(round(clamp(1 - Math.abs(along) / fade, 0, 1), 1e4));
    }
  }

  /** Set the offset on the axes the gesture moves along. */
  function setOffset(point: Point): void {
    springs.x.x = useX ? point.x : 0;
    springs.y.x = useY ? point.y : 0;
  }

  /** The offset a reorder pointer gives: where the pointer puts the element, less what the DOM moves took away. */
  function placeReorder(): void {
    if (!grab) return;
    setOffset({ x: grab.raw.x - shift, y: grab.raw.y - shift });
    write();
  }

  function dispatch(type: string, detail: unknown, cancelable = false): boolean {
    return host.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable, detail }));
  }

  /**
   * Write the position of a keyboard nudge with the layout holding the element, as it holds a pointer drag: the nudged
   * element takes no layout flight, and the other followed elements fly as their own places change. The layout observer
   * reads the mark in the microtask of the write, which is queued before the one that gives the mark back.
   */
  function writeHeld(): void {
    target.setAttribute('data-gesture', 'dragging');
    write();
    queueMicrotask(updateDragging);
  }

  function updateDragging(): void {
    if (holding()) target.setAttribute('data-gesture', 'dragging');
    else target.removeAttribute('data-gesture');
  }

  /** The start and the size of the element along the gesture's axis, as it is drawn. */
  function lineOf(el: Element): { start: number; size: number } {
    const box = (boxes.get(el) ?? el).getBoundingClientRect();
    return axis === 'y' ? { start: box.top, size: box.height } : { start: box.left, size: box.width };
  }

  const centreOf = (el: Element): number => {
    const { start, size } = lineOf(el);
    return start + size / 2;
  };

  /** The siblings that carry the same reorder gesture, the element included, in the order of the DOM. */
  function siblingsOf(): Element[] {
    const parent = host.parentElement;
    if (!parent) return [host];
    return [...parent.children].filter(child => child === host || sameReorder(child));
  }

  function sameReorder(child: Element): boolean {
    const other = bindings.get(child);
    return other !== undefined && other.type === 'reorder' && other.name === name;
  }

  /** Move the element one place among its siblings in the DOM; returns how far its drawn place moved along the axis. */
  function moveBy(step: number, siblings: Element[], index: number): number {
    const neighbour = siblings[index + step];
    const focused = target.ownerDocument.activeElement === target;
    const before = lineOf(host).start;
    reordering = true;
    try {
      if (step > 0) neighbour.after(host);
      else neighbour.before(host);
      if (focused) target.focus({ preventScroll: true });
    } finally {
      reordering = false;
    }
    // The neighbours with a layout motion follow the move through the layout engine's own observer.
    return lineOf(host).start - before;
  }

  /** The step the element takes past a neighbour its centre has crossed: 1 towards the next, -1 towards the previous, 0 for none. */
  function stepOf(siblings: Element[], index: number, centre: number): number {
    const next = siblings[index + 1];
    if (next !== undefined && centre > centreOf(next)) return 1;
    const previous = siblings[index - 1];
    if (previous !== undefined && centre < centreOf(previous)) return -1;
    return 0;
  }

  /** A pointer reorder: the element moves past each neighbour its centre crosses, unless a listener prevents it. */
  function reorderAlong(current: Grab): void {
    for (let guard = 0; grab === current && guard < 64; guard++) {
      const siblings = siblingsOf();
      const index = siblings.indexOf(host);
      const step = stepOf(siblings, index, centreOf(host));
      const neighbour = step === 0 ? undefined : siblings[index + step];
      if (!neighbour) {
        refused = undefined;
        return;
      }
      if (neighbour === refused) return;
      if (!dispatch('motion-reorder', { from: index, to: index + step }, true)) {
        refused = neighbour;
        return;
      }
      refused = undefined;
      shift += moveBy(step, siblings, index);
      placeReorder();
    }
  }

  function record(x: number, y: number): void {
    samples.push({ t: performance.now(), x, y });
    if (samples.length > SAMPLE_COUNT) samples.shift();
  }

  /** The velocity over the newest samples of the last 100 ms, along the gesture's axis; none when the pointer has been still for that long. */
  function measure(): Point {
    const last = samples[samples.length - 1];
    if (!last || performance.now() - last.t > SAMPLE_WINDOW) return { x: 0, y: 0 };
    const first = samples.find(sample => last.t - sample.t <= SAMPLE_WINDOW) ?? last;
    const seconds = (last.t - first.t) / 1000;
    if (!(seconds > 0)) return { x: 0, y: 0 };
    return { x: useX ? (last.x - first.x) / seconds : 0, y: useY ? (last.y - first.y) / seconds : 0 };
  }

  /** Stop the release where it is, with no velocity, and drop what it was to do once it came to rest. */
  function stop(): void {
    halt();
    settled = undefined;
    dragEndDue = false;
    springs.x.v = 0;
    springs.y.v = 0;
  }

  function halt(): void {
    unsubscribe?.();
    unsubscribe = undefined;
    frameAt = undefined;
  }

  const isAt = (state: SpringState, at: number): boolean =>
    Math.abs(state.x - at) < REST_POSITION && Math.abs(state.v) < REST_VELOCITY;

  /** The release is at rest: the offset is its goal, and what was to run once it rests runs now. */
  function arrive(): void {
    halt();
    springs.x.x = goal.x;
    springs.x.v = 0;
    springs.y.x = goal.y;
    springs.y.v = 0;
    write();
    const done = settled;
    settled = undefined;
    dragEndDue = false;
    done?.();
  }

  /**
   * Move the offset to `to` with the release spring, from its place and its velocity; `done` runs once it is at rest.
   * `dragEnd` marks the release of a drag, whose `done` is its motion-dragend.
   */
  function glide(to: Point, done?: () => void, dragEnd = false): void {
    goal.x = useX ? to.x : 0;
    goal.y = useY ? to.y : 0;
    settled = done;
    dragEndDue = dragEnd;
    if (immediate()) {
      arrive();
      return;
    }
    frameAt = undefined;
    unsubscribe ??= runtime.subscribe(`gesture:${name}`, { tick: frame }, { pauseWhenReduced: false });
  }

  /** A frame of the release: the springs integrate the time since the last frame, and arrive once they are at rest. */
  function frame(now: number): void {
    if (destroyed) return;
    const dt = frameAt === undefined ? FIRST_FRAME : Math.min(Math.max(now - frameAt, 0) / 1000, MAX_FRAME);
    frameAt = now;
    if (dt > 0) {
      if (useX) stepSpring(springs.x, goal.x, dt, params);
      if (useY) stepSpring(springs.y, goal.y, dt, params);
    }
    if ((!useX || isAt(springs.x, goal.x)) && (!useY || isAt(springs.y, goal.y))) arrive();
    else write();
  }

  // Under reduced motion, a release in flight arrives at once.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (unsubscribe && runtime.policy.reduced) arrive();
  });

  /** The bounds of a drag, in offset space: where the element's edges meet the content box of its parent. */
  function boundsNow(): Bounds | undefined {
    const parent = host.parentElement;
    if (!bounded || !parent) return undefined;
    const box = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    const left = box.left + pixels(style.borderLeftWidth) + pixels(style.paddingLeft);
    const top = box.top + pixels(style.borderTopWidth) + pixels(style.paddingTop);
    const right = box.right - pixels(style.borderRightWidth) - pixels(style.paddingRight);
    const bottom = box.bottom - pixels(style.borderBottomWidth) - pixels(style.paddingBottom);
    const own = target.getBoundingClientRect();
    // The rest place of the element: where it is, less its offset.
    const restLeft = own.left - springs.x.x;
    const restTop = own.top - springs.y.x;
    const minX = left - restLeft;
    const minY = top - restTop;
    return {
      minX,
      maxX: Math.max(minX, right - (restLeft + own.width)),
      minY,
      maxY: Math.max(minY, bottom - (restTop + own.height)),
    };
  }

  /** The point, clamped to the bounds on the axes the gesture moves along. */
  function within(point: Point, bounds: Bounds | undefined): Point {
    if (!bounds) return point;
    return {
      x: useX ? clamp(point.x, bounds.minX, bounds.maxX) : 0,
      y: useY ? clamp(point.y, bounds.minY, bounds.maxY) : 0,
    };
  }

  function endGrab(current: Grab): void {
    grab = undefined;
    const doc = target.ownerDocument;
    doc.removeEventListener('pointermove', onPointerMove);
    doc.removeEventListener('pointerup', onPointerEnd);
    doc.removeEventListener('pointercancel', onPointerEnd);
    target.style.userSelect = current.userSelect;
    try {
      if (target.hasPointerCapture(current.id)) target.releasePointerCapture(current.id);
    } catch {
      // No capture to give back.
    }
    updateDragging();
  }

  function onPointerDown(event: PointerEvent): void {
    if (destroyed || grab || !event.isPrimary || event.button !== 0) return;
    origin = undefined;
    stop();
    const bounds = boundsNow();
    grab = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      base: { x: springs.x.x, y: springs.y.x },
      raw: { x: springs.x.x, y: springs.y.x },
      bounds,
      userSelect: target.style.userSelect,
    };
    // The pointer is followed on the document: a pointer capture is dropped when the element is moved in the DOM, and a
    // release may happen outside the element.
    const doc = target.ownerDocument;
    doc.addEventListener('pointermove', onPointerMove);
    doc.addEventListener('pointerup', onPointerEnd);
    doc.addEventListener('pointercancel', onPointerEnd);
    target.style.userSelect = 'none';
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      // The engine does not know this pointer: the element still gets its events while the pointer is over it.
    }
    shift = 0;
    refused = undefined;
    samples = [];
    if (gestureType === 'reorder') record(event.clientX, event.clientY);
    else record(springs.x.x, springs.y.x);
    updateDragging();
  }

  function onPointerMove(event: PointerEvent): void {
    const current = grab;
    if (!current || event.pointerId !== current.id) return;
    current.raw = {
      x: current.base.x + event.clientX - current.startX,
      y: current.base.y + event.clientY - current.startY,
    };
    if (gestureType === 'reorder') {
      record(event.clientX, event.clientY);
      placeReorder();
      reorderAlong(current);
    } else {
      setOffset(gestureType === 'drag' ? within(current.raw, current.bounds) : current.raw);
      record(springs.x.x, springs.y.x);
      write();
    }
    measured = measure();
  }

  function onPointerEnd(event: PointerEvent): void {
    const current = grab;
    if (!current || event.pointerId !== current.id) return;
    endGrab(current);
    measured = measure();
    springs.x.v = measured.x;
    springs.y.v = measured.y;
    if (gestureType === 'drag') {
      const thrown = within(
        { x: springs.x.x + measured.x * THROW_TIME, y: springs.y.x + measured.y * THROW_TIME },
        current.bounds,
      );
      glide(thrown, () => dispatch('motion-dragend', { x: springs.x.x, y: springs.y.x }), true);
    } else if (gestureType === 'swipe') {
      const travel = axis === 'y' ? springs.y.x : springs.x.x;
      const speed = axis === 'y' ? measured.y : measured.x;
      const direction = Math.sign(travel) || Math.sign(speed);
      const far = Math.abs(travel) > SWIPE_RATIO * lineOf(target).size || direction * speed > SWIPE_SPEED;
      const way = direction > 0 ? 'end' : 'start';
      if (direction !== 0 && far && dispatch('motion-swipe', { direction: way }, true)) flyOut(way);
      else glide({ x: 0, y: 0 });
    } else {
      glide({ x: 0, y: 0 });
    }
  }

  /**
   * The swipe flies out to its size and 32 px more, fading as it goes; once it is out of sight, assistive technology does not
   * see it, or with `afterFlyOut: 'remove'` the element leaves the DOM.
   */
  function flyOut(way: 'start' | 'end'): void {
    // Focus held inside leaves now, before the element is hidden or removed, as it leaves a presence when its exit starts.
    if (host.matches(':focus-within')) sendFocusAway();
    flown.add(host);
    const distance = lineOf(target).size + SWIPE_MARGIN;
    fade = distance;
    const reach = way === 'end' ? distance : -distance;
    glide(axis === 'y' ? { x: 0, y: reach } : { x: reach, y: 0 }, removeFlown ? removeOutOfSight : hide);
  }

  /**
   * Move focus out of the swiped element: to `restoreFocus`, else to the next sibling that carries the same gesture and has
   * not been swiped away, else the previous one, else the parent. `restoreFocus: false` leaves it where it is.
   */
  function sendFocusAway(): void {
    const { restoreFocus } = options;
    const given = typeof restoreFocus === 'function' ? restoreFocus() : restoreFocus;
    if (given === false) return;
    const parent = host.parentElement;
    const siblings = parent ? [...parent.children] : [];
    const index = siblings.indexOf(host);
    const kin = (el: Element) => !flown.has(el) && bindings.get(el)?.name === name;
    const to = given ?? siblings.slice(index + 1).find(kin) ?? siblings.slice(0, index).reverse().find(kin) ?? parent;
    // A neighbour declared with no box takes focus on its box.
    if (to) moveFocusTo(boxes.get(to) ?? to);
  }

  /** Take the flown-out element out of the DOM, and end the binding with it: the page's list no longer holds it. */
  function removeOutOfSight(): void {
    host.remove();
    destroy();
  }

  /** Hide the element from assistive technology, keeping the aria-hidden the author had. */
  function hide(): void {
    if (ariaHidden === undefined) ariaHidden = host.getAttribute('aria-hidden');
    host.setAttribute('aria-hidden', 'true');
  }

  /** Give the element back to assistive technology, with the aria-hidden the author had. */
  function show(): void {
    if (ariaHidden === undefined) return;
    if (ariaHidden === null) host.removeAttribute('aria-hidden');
    else host.setAttribute('aria-hidden', ariaHidden);
    ariaHidden = undefined;
  }

  function onKeyDown(event: KeyboardEvent): void {
    // A key pressed on a control inside the element belongs to that control.
    if (destroyed || grab || event.target !== target) return;
    if (gestureType === 'drag') nudge(event);
    else if (gestureType === 'swipe') keySwipe(event);
    else keyReorder(event);
  }

  function nudge(event: KeyboardEvent): void {
    const move = ARROWS.get(event.key);
    if (!move) return;
    // The arrows move a drag physically, in right-to-left text too: the reading direction only orders a reorder.
    const [dx, dy] = move;
    if ((dx !== 0 && !useX) || (dy !== 0 && !useY)) return;
    event.preventDefault();
    // The move replaces a release in flight, and the motion-dragend that release owed is given once, where the move leaves it.
    const dragEnded = dragEndDue;
    stop();
    const step = event.shiftKey ? NUDGE_LARGE : NUDGE;
    setOffset(within({ x: springs.x.x + dx * step, y: springs.y.x + dy * step }, boundsNow()));
    measured = { x: 0, y: 0 };
    writeHeld();
    if (dragEnded) dispatch('motion-dragend', { x: springs.x.x, y: springs.y.x });
  }

  function keySwipe(event: KeyboardEvent): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    stop();
    if (dispatch('motion-swipe', { direction: 'end' }, true)) flyOut('end');
  }

  function keyReorder(event: KeyboardEvent): void {
    // On x in right-to-left text the previous sibling is the one on the right, so ArrowRight moves towards it.
    const reversed = axis === 'x' && rightToLeft(target);
    const previousKey = axis === 'y' ? 'ArrowUp' : reversed ? 'ArrowRight' : 'ArrowLeft';
    const nextKey = axis === 'y' ? 'ArrowDown' : reversed ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (origin === undefined) grabKeyboard();
      else dropKeyboard();
    } else if (origin !== undefined && event.key === 'Escape') {
      event.preventDefault();
      cancelKeyboard();
    } else if (origin !== undefined && (event.key === previousKey || event.key === nextKey)) {
      event.preventDefault();
      moveKeyboard(event.key === nextKey ? 1 : -1);
    }
  }

  function grabKeyboard(): void {
    const siblings = siblingsOf();
    stop();
    origin = siblings.indexOf(host);
    updateDragging();
    announce(`Grabbed. Position ${origin + 1} of ${siblings.length}.`);
  }

  /** A keyboard step: the element takes its new place in the DOM, keeps the place it was drawn at, and glides into the new one. */
  function stepKeyboard(siblings: Element[], index: number, step: number): void {
    const moved = moveBy(step, siblings, index);
    if (axis === 'y') springs.y.x -= moved;
    else springs.x.x -= moved;
    write();
    glide({ x: 0, y: 0 });
  }

  function moveKeyboard(step: number): void {
    const siblings = siblingsOf();
    const index = siblings.indexOf(host);
    const to = index + step;
    if (to < 0 || to >= siblings.length || !dispatch('motion-reorder', { from: index, to }, true)) return;
    stepKeyboard(siblings, index, step);
    announce(`Moved. Position ${to + 1} of ${siblings.length}.`);
  }

  function dropKeyboard(): void {
    const siblings = siblingsOf();
    origin = undefined;
    updateDragging();
    announce(`Dropped. Position ${siblings.indexOf(host) + 1} of ${siblings.length}.`);
  }

  /** Escape: the element goes back to the place it had when it was grabbed, one step at a time, each step an event. */
  function cancelKeyboard(): void {
    const start = origin;
    origin = undefined;
    let siblings = siblingsOf();
    let index = siblings.indexOf(host);
    for (let guard = 0; start !== undefined && index !== start && guard < 64; guard++) {
      const step = start > index ? 1 : -1;
      if (!dispatch('motion-reorder', { from: index, to: index + step }, true)) break;
      stepKeyboard(siblings, index, step);
      siblings = siblingsOf();
      index = siblings.indexOf(host);
    }
    updateDragging();
    announce(`Cancelled. Position ${index + 1} of ${siblings.length}.`);
  }

  /** Focus that leaves a grabbed element ends its keyboard grab where it is. */
  function onBlur(): void {
    if (origin === undefined || reordering || target.ownerDocument.activeElement === target) return;
    origin = undefined;
    updateDragging();
  }

  function reset(): void {
    if (destroyed) return;
    if (grab) endGrab(grab);
    origin = undefined;
    updateDragging();
    show();
    flown.delete(host);
    if (fade === undefined) glide({ x: 0, y: 0 });
    else
      glide({ x: 0, y: 0 }, () => {
        fade = undefined;
        target.style.removeProperty('opacity');
      });
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    stop();
    stopPolicy();
    if (grab) endGrab(grab);
    origin = undefined;
    target.removeEventListener('pointerdown', onPointerDown);
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('blur', onBlur);
    if (translated) target.style.removeProperty('translate');
    target.style.touchAction = previousTouchAction;
    if (fade !== undefined) target.style.removeProperty('opacity');
    target.removeAttribute('data-gesture');
    show();
    flown.delete(host);
    if (tabindexAdded) target.removeAttribute('tabindex');
    releaseLive?.();
    for (const each of [host, target]) if (bindings.get(each) === binding) bindings.delete(each);
    if (boxes.get(host) === target) boxes.delete(host);
    releaseRuntime();
  }

  if (development && gestureType === 'reorder' && !host.parentElement) {
    console.error(`[@udixio/motion] gesture "${name}" is bound on an element with no parent: there is no list to reorder it in.`);
  }
  // A gesture needs a focusable element for its keyboard alternative: an element that is not focusable gets tabindex 0.
  if (!target.hasAttribute('tabindex') && target.tabIndex < 0) {
    target.setAttribute('tabindex', '0');
    tabindexAdded = true;
  }
  target.style.touchAction = touchAction;
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('blur', onBlur);

  const binding: GestureBinding = {
    name,
    type: gestureType,
    get offset() {
      return { x: springs.x.x, y: springs.y.x };
    },
    get velocity() {
      return { x: measured.x, y: measured.y, source: 'estimated' as const };
    },
    reset,
    destroy,
  };
  return binding;
}

// Once this module has evaluated, the scanner binds gestures at once, without loading it again.
provideGestures({ gesture, getGesture });
