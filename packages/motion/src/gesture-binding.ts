import { hasNoBox, motionBox } from './box.js';
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
  /** Whether the press gave the element its pointer capture: a capture the hold has is carried to the new box of the element. */
  captured: boolean;
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
/**
 * A keyboard step that nothing moves in the list within this time is said as not moved. A key pressed meanwhile restarts the
 * wait, and its render answers both steps.
 */
const STEP_WAIT = 1000;
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
 * A reorder follows its list while the element is held: when a listener prevents a step and the page's render moves
 * the element later (a framework's state), the element is re-based on its new slot, so it stays under the pointer or
 * glides there from the keyboard, and keeps its focus. The live region says where the held element is each time the
 * list gives it a new place (`Moved. Position 3 of 5.`), whether a keyboard step was prevented or not. A step a
 * listener prevents is the page's to render, and nothing is said while it waits; when nothing has moved the element a
 * second after the key, the region says `Not moved. Position 2 of 5.`, with the place the element holds. Space and
 * Escape say the place the element ends at, once the list holds it.
 *
 * An element declared with no box (`hasNoBox`) carries the state and gives the pixels to its box (`motionBox`): the
 * listeners, `touch-action`, the keyboard alternative's `tabindex`, focus and the written `translate` and `opacity`
 * go to its box; the element stays the one that is moved in its list, removed, hidden from assistive technology after
 * a swipe, and that the events are dispatched on. Its neighbours in a reorder are measured by their boxes. When its
 * box is replaced (a framework renders a new root in its place), the binding goes on and moves to the new box at
 * once, even while a pointer holds the element: the pointer capture moves with it, and the offset is carried. A hold
 * the engine cannot carry to the new box ends with the release spring.
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

/** Say a keyboard step to assistive technology, in the live region; the text it already holds is not said again. */
function announce(text: string): void {
  if (live && live.textContent !== text) live.textContent = text;
}

/**
 * A gesture: `host` is the element the author bound, which is moved in its list, removed, hidden from assistive technology, and
 * dispatches the events; `target`, its box, takes the pointer and the keyboard and is drawn moved. They are one element unless
 * the host is declared with no box. The box follows the host: when the host has no box and its box is replaced, the gesture
 * moves to the new one, and the binding is the same object throughout.
 */
function createBinding(host: HTMLElement, box: HTMLElement, ref: GestureRef, options: GestureOptions): GestureBinding {
  const development = options.development ?? false;
  const { name } = ref;
  const spec: Readonly<GestureSpec> = ref.spec;
  const gestureType = spec.type;
  const axis: Axis = spec.axis ?? DEFAULT_AXIS[gestureType];
  const useX = axis !== 'y';
  const useY = axis !== 'x';
  const bounded = spec.type === 'drag' && spec.bounds !== 'none';
  const params = springParams(spec.timing ?? DEFAULT_GESTURE_TIMING, schemeOf(box));
  const runtime: MotionRuntime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const releaseLive = gestureType === 'reorder' ? holdLive(box.ownerDocument) : undefined;
  // The element that the pointer and the keyboard reach, and that is drawn moved: the box, which follows the host's.
  let target = box;
  // The touch-action of the axis, written when the gesture is bound: the browser decides to pan when a touch starts, which
  // is before any pointerdown. The inline value the box had is given back when the gesture leaves it.
  const touchAction = axis === 'both' ? 'none' : axis === 'x' ? 'pan-y' : 'pan-x';
  let previousTouchAction = '';

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
  // Where the element rests along the axis while it is held, as last measured: a move in the list changes it.
  let slot = 0;
  // The place the list will hold the element at once the keyboard steps a listener prevented are rendered: the place of the
  // last of them. Undefined while no step is open, and the list holds the element where the steps left it.
  let landing: number | undefined;
  // Bumped each time a step opens or closes: the expiry of a step that is no longer the open one does nothing.
  let openTicket = 0;
  // Watches the host while it has no box, so that a box rendered in its place is followed.
  let boxWatcher: MutationObserver | undefined;
  // The place of the held element the live region last described, among its siblings: a render that gives it another one is said.
  let said = 0;
  // A prevented keyboard step waits for the list to render it (`awaiting`), until the list moves the element or STEP_WAIT passes.
  // `movedSince` tells whether the list moved the element while a step waited.
  let awaiting = false;
  let movedSince = false;
  let waitTimer: ReturnType<typeof setTimeout> | undefined;
  // The word of a keyboard grab that ended (Dropped, Cancelled): said once the list holds the element at the place it ends at.
  let finalWord: string | undefined;
  // Watches the list while the element is held, a step is awaited or a word waits: a render that moves it is followed at once.
  let watcher: MutationObserver | undefined;
  // Whether the element holds focus: a render that moves it in the list drops its focus, which it is given back.
  let focused = target.ownerDocument.activeElement === target;
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
    target.setAttribute('data-motion-dragging', '');
    write();
    queueMicrotask(updateDragging);
  }

  function updateDragging(): void {
    if (holding()) target.setAttribute('data-motion-dragging', '');
    else target.removeAttribute('data-motion-dragging');
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

  /**
   * Move the element, which the DOM holds at `index`, to the place `to` among its siblings, and re-base it on its new slot.
   * A place it already holds moves nothing.
   */
  function moveTo(to: number, siblings: Element[], index: number): void {
    if (to === index) return;
    const hadFocus = target.ownerDocument.activeElement === target;
    reordering = true;
    try {
      // A place further on is reached after the sibling that holds it, a place further back before it.
      if (to > index) siblings[to].after(host);
      else siblings[to].before(host);
      if (hadFocus) target.focus({ preventScroll: true });
    } finally {
      reordering = false;
    }
    // The neighbours with a layout motion follow the move through the layout engine's own observer.
    rebase();
  }

  /** Where the element rests along the axis: where it is drawn, less its offset. */
  function restOf(): number {
    return lineOf(host).start - (axis === 'y' ? springs.y.x : springs.x.x);
  }

  /**
   * The list moved the held element, by the gesture or by the page's render: its offset is re-based on its new slot, so it is
   * drawn where it was. A pointer keeps it under the pointer; a keyboard grab glides it from there into the new slot.
   */
  function rebase(): void {
    const rest = restOf();
    const moved = rest - slot;
    slot = rest;
    if (Math.abs(moved) < REST_POSITION) return;
    if (grab) {
      // The neighbour a listener refused is no longer the one past the element.
      refused = undefined;
      shift += moved;
      placeReorder();
      return;
    }
    if (axis === 'y') springs.y.x -= moved;
    else springs.x.x -= moved;
    write();
    glide({ x: 0, y: 0 });
  }

  /**
   * The list changed while it is watched: the element gets back the focus the move dropped, the held element is re-based, a
   * pointer goes on, and a keyboard grab says the place its element is given, and an ended grab says its word.
   */
  function onListChange(): void {
    if (destroyed) return;
    const doc = target.ownerDocument;
    if (focused && (doc.activeElement === null || doc.activeElement === doc.body)) target.focus({ preventScroll: true });
    if (holding()) rebase();
    if (grab) reorderAlong(grab);
    settle();
    watch();
  }

  /**
   * The list rendered the element at a place: a keyboard grab says it when the place is new (`Moved. Position 3 of 5.`), and an
   * ended grab says its word once the place its steps leave is rendered. A pointer grab says nothing.
   */
  function settle(): void {
    if (origin === undefined && finalWord === undefined) return;
    const siblings = siblingsOf();
    const index = siblings.indexOf(host);
    if (finalWord !== undefined) {
      // The steps still open leave the element at `landing`: the word waits for that place, else for the first render that moves it.
      if (landing !== undefined ? index === landing : index !== said) finishFinal();
      return;
    }
    if (landing !== undefined && index === landing) closeStep();
    if (index === said) return;
    said = index;
    movedSince = true;
    if (landing === undefined) {
      awaiting = false;
      clearWait();
    }
    announce(`Moved. Position ${index + 1} of ${siblings.length}.`);
  }

  /** Watch the list of a reorder while the element is held, a step is awaited or a word waits, and only then. */
  function watch(): void {
    const parent = host.parentElement;
    if (gestureType === 'reorder' && (holding() || awaiting || finalWord !== undefined) && parent) {
      if (watcher) return;
      watcher = new MutationObserver(onListChange);
      watcher.observe(parent, { childList: true });
    } else {
      watcher?.disconnect();
      watcher = undefined;
    }
  }

  /** The index the element takes among its siblings: where the open keyboard steps leave it, else where the list holds it. */
  function placeIn(siblings: Element[]): number {
    return landing ?? siblings.indexOf(host);
  }

  /** The place the element holds, as the live region says it, with the open steps taken into account. */
  function placeText(): string {
    const siblings = siblingsOf();
    return `Position ${placeIn(siblings) + 1} of ${siblings.length}.`;
  }

  /** Say a keyboard step, and the place the element holds, with the open steps taken into account. */
  function say(word: string): void {
    announce(`${word}. ${placeText()}`);
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
      moveTo(index + step, siblings, index);
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
    watch();
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
    flushFinal();
    stop();
    const bounds = boundsNow();
    const started: Grab = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      base: { x: springs.x.x, y: springs.y.x },
      raw: { x: springs.x.x, y: springs.y.x },
      bounds,
      userSelect: target.style.userSelect,
      captured: false,
    };
    grab = started;
    // The pointer is followed on the document: a pointer capture is dropped when the element is moved in the DOM, and a
    // release may happen outside the element.
    const doc = target.ownerDocument;
    doc.addEventListener('pointermove', onPointerMove);
    doc.addEventListener('pointerup', onPointerEnd);
    doc.addEventListener('pointercancel', onPointerEnd);
    target.style.userSelect = 'none';
    try {
      target.setPointerCapture(event.pointerId);
      started.captured = true;
    } catch {
      // The engine does not know this pointer: the element still gets its events while the pointer is over it.
    }
    shift = 0;
    refused = undefined;
    closeStep();
    if (gestureType === 'reorder') slot = restOf();
    watch();
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
    release(current);
  }

  /** The hold of a pointer ends: the element is thrown on, or glides back on the release spring, from where it is held. */
  function release(current: Grab): void {
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
    stop();
    flushFinal();
    closeStep();
    awaiting = false;
    clearWait();
    origin = siblingsOf().indexOf(host);
    said = origin;
    movedSince = false;
    slot = restOf();
    watch();
    updateDragging();
    say('Grabbed');
  }

  /**
   * A keyboard step: the element takes its new place in the DOM, keeps the place it was drawn at, and glides into the new one.
   * A step a listener prevents is the page's to render: the list is watched for it (`openStep`). A step starts from the place the
   * open steps leave the element at, so steps pressed before the render compose.
   */
  function moveKeyboard(step: number): void {
    const siblings = siblingsOf();
    const index = siblings.indexOf(host);
    const from = placeIn(siblings);
    const to = from + step;
    if (to < 0 || to >= siblings.length) return;
    if (dispatch('motion-reorder', { from, to }, true)) {
      moveTo(to, siblings, index);
      closeStep();
      awaiting = false;
      clearWait();
      said = to;
      say('Moved');
    } else {
      openStep(to);
    }
  }

  /** Space or Enter: the grab ends where the list holds the element, and says that place once the list holds it. */
  function dropKeyboard(): void {
    endKeyboard('Dropped');
  }

  /**
   * Escape: the element goes back to the place it had when it was grabbed, one step at a time, each step an event. A step a
   * listener prevents is not rendered yet: the walk goes on from the place the open steps leave the element at, so every step
   * of the grab is walked back, and the place it ends at is said once the list holds it.
   */
  function cancelKeyboard(): void {
    const start = origin;
    origin = undefined;
    for (let guard = 0; start !== undefined && guard < 64; guard++) {
      const siblings = siblingsOf();
      const index = siblings.indexOf(host);
      const from = placeIn(siblings);
      if (from === start) break;
      const to = start > from ? from + 1 : from - 1;
      if (dispatch('motion-reorder', { from, to }, true)) {
        moveTo(to, siblings, index);
        closeStep();
      } else {
        openStep(to);
      }
    }
    endKeyboard('Cancelled');
  }

  /**
   * The keyboard grab ends with `word`. Its word says the place the element holds: at once when no step is awaited, else once
   * the list renders the step (the place the step leaves the element at), or once STEP_WAIT has passed.
   */
  function endKeyboard(word: string): void {
    origin = undefined;
    updateDragging();
    said = siblingsOf().indexOf(host);
    finalWord = word;
    if (awaiting) watch();
    else finishFinal();
  }

  /** Say the word of an ended grab, with the place the element holds, and end the wait for its render. */
  function finishFinal(): void {
    const word = finalWord;
    finalWord = undefined;
    awaiting = false;
    clearWait();
    closeStep();
    watch();
    if (word !== undefined) say(word);
  }

  /** A grab that begins again says the word of the one that ended before, where the list holds the element. */
  function flushFinal(): void {
    if (finalWord !== undefined) finishFinal();
  }

  /**
   * A prevented step: the element stays where the step leaves it, and the list is watched until it renders it. Two animation
   * frames without a render, the step expires and nothing is said; the place the list gives the element is then read from the
   * DOM when it renders. A step the list has not moved STEP_WAIT after the key is said as not moved.
   */
  function openStep(to: number): void {
    if (!awaiting) movedSince = false;
    landing = to;
    awaiting = true;
    watch();
    armWait();
    const ticket = ++openTicket;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (ticket === openTicket && landing !== undefined) dropStep();
      }),
    );
  }

  /** The open step is over: the list rendered it, or the grab it belongs to ended. */
  function closeStep(): void {
    landing = undefined;
    openTicket++;
  }

  /** A step that two frames passed without a render: nothing is said, and the step is still awaited (see `waitEnded`). */
  function dropStep(): void {
    closeStep();
    watch();
  }

  /** Start the wait of the steps: a key pressed meanwhile restarts it. */
  function armWait(): void {
    clearWait();
    waitTimer = setTimeout(waitEnded, STEP_WAIT);
  }

  function clearWait(): void {
    if (waitTimer !== undefined) clearTimeout(waitTimer);
    waitTimer = undefined;
  }

  /**
   * STEP_WAIT has passed: an ended grab says its place, and a keyboard step that the list did not move is said as not moved,
   * with the place the element holds.
   */
  function waitEnded(): void {
    waitTimer = undefined;
    if (destroyed) return;
    if (finalWord !== undefined) {
      finishFinal();
      return;
    }
    if (!awaiting) return;
    awaiting = false;
    closeStep();
    watch();
    if (origin !== undefined && !movedSince) announce(`Not moved. ${placeText()}`);
  }

  /** Give a box what the gesture needs: its listeners, its touch-action, and a tabindex for the keyboard alternative. */
  function attach(el: HTMLElement): void {
    // A gesture needs a focusable element for its keyboard alternative: an element that is not focusable gets tabindex 0.
    if (!el.hasAttribute('tabindex') && el.tabIndex < 0) {
      el.setAttribute('tabindex', '0');
      tabindexAdded = true;
    }
    previousTouchAction = el.style.touchAction;
    el.style.touchAction = touchAction;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onBlur);
  }

  /** Take from a box what `attach` gave it and what the gesture wrote on it, and give back what the author had there. */
  function detach(el: HTMLElement): void {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('keydown', onKeyDown);
    el.removeEventListener('focus', onFocus);
    el.removeEventListener('blur', onBlur);
    if (translated) el.style.removeProperty('translate');
    translated = false;
    el.style.touchAction = previousTouchAction;
    if (fade !== undefined) el.style.removeProperty('opacity');
    el.removeAttribute('data-motion-dragging');
    if (tabindexAdded) el.removeAttribute('tabindex');
    tabindexAdded = false;
  }

  /**
   * The box of a host with no box changed: the gesture moves to the new box, at once, a pointer that holds the element included
   * (`switchBox`). A keyboard grab moves with its focus.
   */
  function followBox(): void {
    if (destroyed) return;
    const next = motionBox(host, options.boxless) as HTMLElement;
    if (next !== target) switchBox(next);
  }

  /**
   * Move the gesture to `next`, the box that replaced the one it was on. The listeners, the touch-action, the tabindex, the
   * `translate` and `opacity` it wrote, the drag state and the focus go with it, and the binding is the same object. A pointer that
   * holds the element carries on with the new box: its offset is written there, and its pointer capture goes with it
   * (`carryCapture`). A held reorder re-bases on its place in the list, which the list may have moved while the box was out of it.
   */
  function switchBox(next: HTMLElement): void {
    const previous = target;
    const doc = previous.ownerDocument;
    // Focus still on the old box, or taken from it by the swap, goes to the new box.
    const hadFocus = doc.activeElement === previous || (focused && (doc.activeElement === null || doc.activeElement === doc.body));
    const held = holding();
    const current = grab;
    const carried = translated || fade !== undefined;
    detach(previous);
    if (bindings.get(previous) === binding) bindings.delete(previous);
    bindings.get(next)?.destroy();
    target = next;
    bindings.set(next, binding);
    boxes.set(host, next);
    attach(next);
    if (current) next.style.userSelect = 'none';
    if (carried) write();
    if (hadFocus) next.focus({ preventScroll: true });
    focused = doc.activeElement === next;
    updateDragging();
    if (held && gestureType === 'reorder') rebase();
    // A hold that the new box cannot carry ends here, with the release spring from where the pointer left the element.
    if (current && !carryCapture(current, next)) release(current);
  }

  /**
   * Give the pointer capture of a hold to the new box, for the same pointer. A hold with no capture (the engine refused it at the
   * press) has nothing to carry: its document listeners go on. False when the new box does not take the capture.
   */
  function carryCapture(current: Grab, next: HTMLElement): boolean {
    if (!current.captured) return true;
    try {
      next.setPointerCapture(current.id);
    } catch {
      current.captured = false;
      return false;
    }
    current.captured = next.hasPointerCapture(current.id);
    return current.captured;
  }

  function onFocus(): void {
    focused = true;
  }

  /**
   * Focus that leaves a grabbed element ends its keyboard grab where it is. A render that moves the element in the list blurs
   * it in some engines, and drops its focus with no event in others: the blur is read in a microtask, once the list change
   * that may have caused it is.
   */
  function onBlur(): void {
    if (reordering) return;
    queueMicrotask(() => {
      if (destroyed) return;
      if ((watcher?.takeRecords().length ?? 0) > 0) onListChange();
      // A box the host changed to in the same task: the focus the swap took goes to the new box, which keeps the grab.
      if ((boxWatcher?.takeRecords().length ?? 0) > 0) followBox();
      if (target.ownerDocument.activeElement === target) return;
      focused = false;
      if (origin === undefined) return;
      origin = undefined;
      updateDragging();
      watch();
    });
  }

  function reset(): void {
    if (destroyed) return;
    if (grab) endGrab(grab);
    origin = undefined;
    watch();
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
    boxWatcher?.disconnect();
    boxWatcher = undefined;
    if (grab) endGrab(grab);
    origin = undefined;
    closeStep();
    clearWait();
    finalWord = undefined;
    awaiting = false;
    watch();
    detach(target);
    show();
    flown.delete(host);
    releaseLive?.();
    for (const each of [host, target]) if (bindings.get(each) === binding) bindings.delete(each);
    if (boxes.get(host) === target) boxes.delete(host);
    releaseRuntime();
  }

  if (development && gestureType === 'reorder' && !host.parentElement) {
    console.error(`[@udixio/motion] gesture "${name}" is bound on an element with no parent: there is no list to reorder it in.`);
  }
  attach(target);
  // An element declared with no box is followed: a box rendered in its place takes the gesture, which stays the same binding.
  if (hasNoBox(host, options.boxless)) {
    boxWatcher = new MutationObserver(followBox);
    boxWatcher.observe(host, { childList: true, subtree: true });
  }

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
