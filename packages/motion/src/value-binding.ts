import { provideValues } from './feature-loader.js';
import { motionManifest } from './manifest.js';
import { motionDisabled } from './play.js';
import { getMotionRuntime, retainMotionRuntime, type MotionRuntime } from './runtime.js';
import { stepSpring, type SpringState } from './spring-step.js';
import { resolveCurve, springParams, type MotionScheme } from './tokens.js';
import { resolveValue, type ValueRef, type ValueSpec, type ValueSource } from './value.js';
import { VISUALLY_HIDDEN } from './visually-hidden.js';
import { watchView } from './viewport.js';

/** A value bound to an element: the number it writes, its state setter, and its listeners. */
export interface ValueBinding {
  readonly name: string;
  /** The number currently written: rounded to the four decimals the variable holds. */
  readonly current: number;
  /** Source `state`: the target the value moves to (clamped to `range`). Other sources: TypeError. */
  set(target: number): void;
  /**
   * Call `listener` after each written change, that is on each frame; with `perFrame: false`, only when the value comes to
   * rest and when its target changes (with the number it moves to). Returns an unsubscribe function.
   */
  subscribe(listener: (value: number) => void, options?: { perFrame?: boolean }): () => void;
  /** Stop writing. A counter that showed a number shows its final number, the one it was moving to. */
  destroy(): void;
}

/** The longest frame step that is integrated, in seconds: a frame after a pause moves the spring at most this far. */
const MAX_FRAME = 1 / 30;
/** The time the first frame of a motion integrates: the change came during the frame before, so the motion starts on the next one. */
const FIRST_FRAME = 1 / 60;
/** A smoothed value is at rest when it is this close to its goal, as a fraction of its span... */
const POSITION_EPSILON = 1e-4;
/** ...and moves this slowly, as a fraction of its span per second. */
const VELOCITY_EPSILON = 1e-3;

const bindings = new WeakMap<Element, Map<string, ValueBinding>>();

/** The value bound under `name` on an element, if any. */
export function getValue(target: Element, name: string): ValueBinding | undefined {
  return bindings.get(target)?.get(name);
}

/** The values bound on an element, whatever their names. */
export function valuesOf(target: Element): ValueBinding[] {
  return [...(bindings.get(target)?.values() ?? [])];
}

function register(target: Element, binding: ValueBinding): void {
  let map = bindings.get(target);
  if (!map) bindings.set(target, (map = new Map()));
  map.set(binding.name, binding);
}

/** Forget a binding, if it is still the one registered under its name. */
function unregister(target: Element, binding: ValueBinding): void {
  const map = bindings.get(target);
  if (map?.get(binding.name) !== binding) return;
  map.delete(binding.name);
  if (map.size === 0) bindings.delete(target);
}

/**
 * Bind a value to an element: it writes `--udx-motion-value-<name>` there, and keeps writing it until the binding is
 * destroyed. Binding a name again on the same element destroys the previous binding. The `development` option only
 * reports a `value` attribute that is not a number.
 */
export function value(target: HTMLElement, source: ValueRef | string, options: { development?: boolean } = {}): ValueBinding {
  const ref = typeof source === 'string' ? resolveValue(source) : source;
  if (!ref) throw new Error(`Unknown value "${typeof source === 'string' ? source : source.name}"`);
  getValue(target, ref.name)?.destroy();
  const binding = createBinding(target, ref, options.development ?? false);
  register(target, binding);
  return binding;
}

function schemeOf(target: HTMLElement): MotionScheme {
  return target.ownerDocument.documentElement.dataset.motionScheme === 'standard' ? 'standard' : 'expressive';
}

/** A number from a `value` attribute, or undefined when there is no number in it. */
function parseNumber(text: string | null): number | undefined {
  if (text === null || text.trim() === '') return undefined;
  const number = Number(text.trim());
  return Number.isFinite(number) ? number : undefined;
}

/** The digits a `decimal` counter writes: those of its value attribute as written (`12.50` has two), at least one. */
function decimalsOf(text: string | null): number {
  const digits = /\.(\d+)\s*$/.exec(text ?? '')?.[1].length ?? 0;
  return Math.min(20, Math.max(1, digits));
}

function formatOptionsOf(spec: Readonly<ValueSpec>, attribute: string | null): Intl.NumberFormatOptions {
  switch (spec.format) {
    case 'decimal': {
      const digits = decimalsOf(attribute);
      return { minimumFractionDigits: digits, maximumFractionDigits: digits };
    }
    case 'percent':
      return { style: 'percent', maximumFractionDigits: 0 };
    case 'currency':
      return { style: 'currency', currency: spec.currency };
    default:
      return { maximumFractionDigits: 0 };
  }
}

/**
 * The formatter of a counter, in the language of the nearest `lang` on the page. An engine that refuses the language or
 * the options gets the default language, then the default options: a motion never throws while it renders.
 */
function formatterOf(target: HTMLElement, spec: Readonly<ValueSpec>): Intl.NumberFormat {
  const lang = target.closest('[lang]')?.getAttribute('lang') || undefined;
  const options = formatOptionsOf(spec, target.getAttribute('value'));
  try {
    return new Intl.NumberFormat(lang, options);
  } catch {
    try {
      return new Intl.NumberFormat(undefined, options);
    } catch {
      return new Intl.NumberFormat();
    }
  }
}

function createBinding(target: HTMLElement, ref: ValueRef, development: boolean): ValueBinding {
  const { name } = ref;
  const spec: Readonly<ValueSpec> = ref.spec;
  const source: ValueSource = spec.source;
  const [first, last] = spec.range ?? [0, 1];
  const low = Math.min(first, last);
  const high = Math.max(first, last);
  const span = Math.abs(last - first);
  const property = `--udx-motion-value-${name}`;
  const view = target.ownerDocument.defaultView ?? window;
  const runtime: MotionRuntime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const listeners = new Set<(value: number) => void>();
  // The listeners that are told of the rest and of the target changes, not of each frame.
  const settledListeners = new Set<(value: number) => void>();
  // Whether the rest of the value was told since it last moved: a value is told once at each stop, not on each frame.
  // A time value starts running, so it has not rested.
  let restAnnounced = source !== 'time';
  const spring = spec.spring;
  const params = source !== 'time' && spring !== undefined && spring !== 'none' ? springParams(spring, schemeOf(target)) : undefined;
  // A counter also writes its number as text: formatted for the page's language, and counting up when it comes into view.
  const formatter = source === 'state' && spec.format !== undefined ? formatterOf(target, spec) : undefined;

  let destroyed = false;
  let written = NaN;
  let text = '';
  // Spring state, in the units of the value: where it is and how fast it moves, and where it is going.
  const springState: SpringState = { x: 0, v: 0 };
  let goal = 0;
  // The runtime subscription: the spring while it moves, the clock of a time value always.
  let unsubscribe: (() => void) | undefined;
  let frameAt: number | undefined;
  let start = 0;
  let frozen = false;
  const period = source === 'time' ? periodOf(spec) : 0;
  let detachInputs: () => void = () => {};
  let observer: MutationObserver | undefined;
  // A counter is `pending` until the first report of its view, `waiting` out of view with its start shown, then `live`.
  // Any other value is `live` from the start.
  let phase: 'pending' | 'waiting' | 'live' = formatter ? 'pending' : 'live';
  // The text of a counter, once it has shown one: a counter in view at load keeps its server text until it moves.
  let shown = false;
  let shownLabel: string | undefined;
  // While the shown label is not the final one, the counter's text is two spans: the shown one, hidden from assistive
  // technology, and the final one, visually hidden, which is what a screen reader reads.
  let spans: { shown: HTMLElement; final: HTMLElement } | undefined;
  let stopWatch: (() => void) | undefined;

  const clamp = (amount: number) => Math.min(high, Math.max(low, amount));
  const clamp01 = (progress: number) => Math.min(1, Math.max(0, progress));
  const toValue = (progress: number) => first + progress * (last - first);

  /** Tell the settled listeners that the value rests on `value`, once for each stop. */
  function announceRest(value: number): void {
    if (restAnnounced) return;
    restAnnounced = true;
    for (const listener of [...settledListeners]) listener(value);
  }

  /** Write the number, rounded to four decimals, when it changed; then its text, and tell the listeners. */
  function write(amount: number): void {
    if (destroyed) return;
    const rounded = Math.round(amount * 1e4) / 1e4;
    const next = String(rounded);
    if (next === text) return;
    text = next;
    written = rounded;
    target.style.setProperty(property, next);
    paint(rounded);
    for (const listener of [...listeners]) listener(rounded);
  }

  /**
   * The text of a counter that has shown one. Its shown label is written only when it changed; the element is one text
   * node once the shown label is the final one, and two spans while it is not.
   */
  function paint(amount: number): void {
    if (!formatter || !shown) return;
    const label = formatter.format(amount);
    if (label === shownLabel) return;
    shownLabel = label;
    const final = formatter.format(goal);
    if (label === final) collapse(final);
    else if (spans) spans.shown.textContent = label;
    else split(label, final);
  }

  /** The final number of a counter moved: the visually hidden copy follows it, or the single text node is that number. */
  function retarget(): void {
    if (!formatter || !shown || shownLabel === undefined) return;
    const final = formatter.format(goal);
    if (shownLabel === final) {
      if (spans) collapse(final);
    } else if (spans) {
      if (spans.final.textContent !== final) spans.final.textContent = final;
    } else split(shownLabel, final);
  }

  /** The two spans of a counter whose shown number is not its final one. */
  function split(shownText: string, finalText: string): void {
    const visible = target.ownerDocument.createElement('span');
    visible.setAttribute('aria-hidden', 'true');
    visible.textContent = shownText;
    const hidden = target.ownerDocument.createElement('span');
    hidden.setAttribute('data-udx-motion-sr', '');
    hidden.style.cssText = VISUALLY_HIDDEN;
    hidden.textContent = finalText;
    spans = { shown: visible, final: hidden };
    target.replaceChildren(visible, hidden);
  }

  /** One text node, the final number of a counter. */
  function collapse(finalText: string): void {
    spans = undefined;
    target.textContent = finalText;
  }

  /** Stop the runtime subscription of a spring at rest or interrupted. */
  function halt(): void {
    unsubscribe?.();
    unsubscribe = undefined;
  }

  /** Set the spring at its goal, at rest, and write it. */
  function snap(): void {
    halt();
    springState.x = goal;
    springState.v = 0;
    write(goal);
    announceRest(goal);
  }

  /** Whether the value is written at once rather than moved to: reduced motion, or `--udx-motion: none`. */
  const immediate = () => runtime.policy.reduced || motionDisabled(target);

  /** The frame of a moving spring: it integrates the time since the last frame, and rests once it is at its goal. */
  function step(now: number): void {
    const dt = frameAt === undefined ? FIRST_FRAME : Math.min(Math.max(now - frameAt, 0) / 1000, MAX_FRAME);
    frameAt = now;
    if (params && dt > 0) stepSpring(springState, goal, dt, params);
    if (Math.abs(springState.x - goal) < POSITION_EPSILON * span && Math.abs(springState.v) < VELOCITY_EPSILON * span) {
      snap();
      return;
    }
    write(springState.x);
  }

  /**
   * The frame of a time value: its progress through the period, from the moment it was bound. `--udx-motion` is read at each
   * frame, so that a change takes effect at once (about 15 µs a frame on Chromium, measured): `none` holds the start.
   */
  function tickTime(now: number): void {
    frozen = motionDisabled(target);
    if (frozen) {
      write(first);
      announceRest(first);
      return;
    }
    restAnnounced = false;
    const elapsed = now - start;
    write(toValue((((elapsed % period) + period) % period) / period));
  }

  /**
   * Move a smoothed value to `next`. It keeps its position and velocity, so a target that moves again continues the
   * motion. Under reduced motion or `--udx-motion: none`, or without a spring, it is written at once.
   */
  function aim(next: number): void {
    if (destroyed) return;
    const changed = next !== goal;
    goal = next;
    if (changed) restAnnounced = false;
    retarget();
    // A counter that has not started keeps its place: it moves once its view reports it in view.
    if (phase !== 'live') return;
    if (!params || immediate()) {
      snap();
      return;
    }
    if (changed) for (const listener of [...settledListeners]) listener(next);
    if (!unsubscribe) {
      frameAt = undefined;
      unsubscribe = runtime.subscribe(`value:${name}`, { tick: step }, { pauseWhenReduced: false });
    }
  }

  function initialPosition(): number {
    if (source === 'pointer') {
      const axis = spec.axis ?? 'x';
      const onMove = (event: PointerEvent) => {
        const rect = target.getBoundingClientRect();
        const size = axis === 'x' ? rect.width : rect.height;
        if (!(size > 0)) return;
        const offset = axis === 'x' ? event.clientX - rect.left : event.clientY - rect.top;
        aim(toValue(clamp01(offset / size)));
      };
      const onLeave = () => aim(toValue(0.5));
      target.addEventListener('pointermove', onMove, { passive: true });
      target.addEventListener('pointerleave', onLeave, { passive: true });
      detachInputs = () => {
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerleave', onLeave);
      };
      return toValue(0.5);
    }
    if (source === 'scroll') {
      const block = (spec.axis ?? 'block') === 'block';
      const progress = (): number => {
        const root = target.ownerDocument.documentElement;
        if (block) {
          const room = root.scrollHeight - view.innerHeight;
          return room > 0 ? clamp01(view.scrollY / room) : 0;
        }
        const room = root.scrollWidth - view.innerWidth;
        // In a right-to-left page the horizontal scroll position is negative: its magnitude is the progress.
        return room > 0 ? clamp01(Math.abs(view.scrollX) / room) : 0;
      };
      const onScroll = () => aim(toValue(progress()));
      view.addEventListener('scroll', onScroll, { passive: true });
      detachInputs = () => view.removeEventListener('scroll', onScroll);
      return toValue(progress());
    }
    if (source === 'state') {
      const readAttribute = (): void => {
        const attribute = target.getAttribute('value');
        if (attribute === null) return;
        const parsed = parseNumber(attribute);
        if (parsed === undefined) {
          if (development) console.error(`[@udixio/motion] data-value "${attribute}" for value "${name}" is not a number: ignored.`);
          return;
        }
        aim(clamp(parsed));
      };
      observer = new MutationObserver(readAttribute);
      observer.observe(target, { attributes: true, attributeFilter: ['value'] });
      return clamp(parseNumber(target.getAttribute('value')) ?? first);
    }
    start = performance.now();
    frozen = motionDisabled(target);
    return first;
  }

  /**
   * The first reports of a counter's view decide what it shows. In view, its server text stays and nothing moves, unless
   * its value changed since bind. Out of view, it shows its start, and it counts up when it comes into view.
   */
  function onView(inView: boolean): void {
    if (destroyed || phase === 'live') return;
    if (phase === 'pending') {
      shown = true;
      if (inView) {
        phase = 'live';
        stopWatch?.();
        if (goal !== springState.x) aim(goal);
        return;
      }
      phase = 'waiting';
      springState.x = first;
      springState.v = 0;
      write(first);
      paint(first);
      return;
    }
    if (!inView) return;
    phase = 'live';
    stopWatch?.();
    aim(goal);
  }

  const initial = initialPosition();
  springState.x = initial;
  goal = initial;
  write(initial);

  if (source === 'time') {
    unsubscribe = runtime.subscribe(`value:${name}`, { tick: tickTime }, { pauseWhenReduced: true, root: target });
  }

  // Under reduced motion, a smoothed value that is moving stops at its goal; a time value holds the start of its range.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (!runtime.policy.reduced) return;
    if (source === 'time') {
      write(first);
      announceRest(first);
    } else if (phase === 'live') snap();
  });

  if (formatter) stopWatch = watchView(target, 'block', onView);

  const binding: ValueBinding = {
    name,
    get current() {
      return written;
    },
    set(next: number) {
      if (source !== 'state') throw new TypeError(`set applies to a state value; "${name}" is a ${source} value`);
      if (!Number.isFinite(next)) throw new TypeError(`set expects a finite number for "${name}"`);
      if (destroyed) return;
      aim(clamp(next));
    },
    subscribe(listener, options = {}) {
      const set = options.perFrame === false ? settledListeners : listeners;
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopWatch?.();
      stopWatch = undefined;
      unsubscribe?.();
      unsubscribe = undefined;
      stopPolicy();
      detachInputs();
      observer?.disconnect();
      // A counter that showed a number ends on its final one, as one text node, not on the step of a count cut short.
      if (formatter && shownLabel !== undefined) collapse(formatter.format(goal));
      target.style.removeProperty(property);
      listeners.clear();
      settledListeners.clear();
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

/** The period of a time value, in milliseconds: the duration of its timing. */
function periodOf(spec: Readonly<ValueSpec>): number {
  return resolveCurve(spec.timing ?? motionManifest.defaults.loop.curve).duration;
}

// Once this module has evaluated, the scanner binds values at once, without loading it again.
provideValues({ value, getValue, valuesOf });
