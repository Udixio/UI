import { motionManifest } from './manifest.js';
import { motionDisabled } from './play.js';
import { getMotionRuntime, retainMotionRuntime, type MotionRuntime } from './runtime.js';
import { resolveCurve, springParams, type MotionScheme } from './tokens.js';
import { resolveValue, type ValueRef, type ValueSpec, type ValueSource } from './value.js';

/** A value bound to an element: the number it writes, its state setter, and its listeners. */
export interface ValueBinding {
  readonly name: string;
  /** The number currently written: rounded to the four decimals the variable holds. */
  readonly current: number;
  /** Source `state`: the target the value moves to (clamped to `range`). Other sources: TypeError. */
  set(target: number): void;
  /** Call `listener` after each written change; returns an unsubscribe function. */
  subscribe(listener: (value: number) => void): () => void;
  destroy(): void;
}

/** The longest sub-step of the integration, in seconds. */
const MAX_STEP = 1 / 240;
/** The longest frame step that is integrated, in seconds: a frame after a pause moves the spring at most this far. */
const MAX_FRAME = 1 / 30;
/** A smoothed value is at rest when it is this close to its goal, as a fraction of its span... */
const POSITION_EPSILON = 1e-4;
/** ...and moves this slowly, as a fraction of its span per second. */
const VELOCITY_EPSILON = 1e-3;

const bindings = new WeakMap<Element, Map<string, ValueBinding>>();

/** The value bound under `name` on an element, if any. */
export function getValue(target: Element, name: string): ValueBinding | undefined {
  return bindings.get(target)?.get(name);
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
  const spring = spec.spring;
  const params = source !== 'time' && spring !== undefined && spring !== 'none' ? springParams(spring, schemeOf(target)) : undefined;

  let destroyed = false;
  let written = NaN;
  let text = '';
  // Spring state, in the units of the value: where it is, how fast it moves, and where it is going.
  let position = 0;
  let velocity = 0;
  let goal = 0;
  // The runtime subscription: the spring while it moves, the clock of a time value always.
  let unsubscribe: (() => void) | undefined;
  let frameAt: number | undefined;
  let start = 0;
  const period = source === 'time' ? periodOf(spec) : 0;
  let detachInputs: () => void = () => {};
  let observer: MutationObserver | undefined;

  const clamp = (amount: number) => Math.min(high, Math.max(low, amount));
  const clamp01 = (progress: number) => Math.min(1, Math.max(0, progress));
  const toValue = (progress: number) => first + progress * (last - first);

  /** Write the number, rounded to four decimals, when it changed; then tell the listeners. */
  function write(amount: number): void {
    if (destroyed) return;
    const rounded = Math.round(amount * 1e4) / 1e4;
    const next = String(rounded);
    if (next === text) return;
    text = next;
    written = rounded;
    target.style.setProperty(property, next);
    for (const listener of [...listeners]) listener(rounded);
  }

  /** Stop the runtime subscription of a spring at rest or interrupted. */
  function halt(): void {
    unsubscribe?.();
    unsubscribe = undefined;
  }

  /** Set the spring at its goal, at rest, and write it. */
  function snap(): void {
    halt();
    position = goal;
    velocity = 0;
    write(goal);
  }

  /** Whether the value is written at once rather than moved to: reduced motion, or `--udx-motion: none`. */
  const immediate = () => runtime.policy.reduced || motionDisabled(target);

  /** One step of the spring over `dt` seconds: semi-implicit Euler, in sub-steps of at most 1/240 s. */
  function integrate(dt: number, parameters: { dampingRatio: number; stiffness: number }): void {
    const { dampingRatio, stiffness } = parameters;
    const damping = 2 * dampingRatio * Math.sqrt(stiffness);
    const steps = Math.ceil(dt / MAX_STEP);
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const acceleration = -stiffness * (position - goal) - damping * velocity;
      velocity += acceleration * h;
      position += velocity * h;
    }
  }

  /** The frame of a moving spring: it integrates the time since the last frame, and rests once it is at its goal. */
  function step(now: number): void {
    const dt = frameAt === undefined ? 0 : Math.min(Math.max(now - frameAt, 0) / 1000, MAX_FRAME);
    frameAt = now;
    if (params && dt > 0) integrate(dt, params);
    if (Math.abs(position - goal) < POSITION_EPSILON * span && Math.abs(velocity) < VELOCITY_EPSILON * span) {
      snap();
      return;
    }
    write(position);
  }

  /** The frame of a time value: its progress through the period, from the moment it was bound. */
  function tickTime(now: number): void {
    if (motionDisabled(target)) {
      write(first);
      return;
    }
    const elapsed = now - start;
    write(toValue((((elapsed % period) + period) % period) / period));
  }

  /**
   * Move a smoothed value to `next`. It keeps its position and velocity, so a target that moves again continues the
   * motion. Under reduced motion or `--udx-motion: none`, or without a spring, it is written at once.
   */
  function aim(next: number): void {
    if (destroyed) return;
    goal = next;
    if (!params || immediate()) {
      snap();
      return;
    }
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
    return first;
  }

  const initial = initialPosition();
  position = initial;
  goal = initial;
  write(initial);

  if (source === 'time') unsubscribe = runtime.subscribe(`value:${name}`, { tick: tickTime }, { pauseWhenReduced: true, root: target });

  // Under reduced motion, a smoothed value that is moving stops at its goal; a time value holds the start of its range.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (!runtime.policy.reduced) return;
    if (source === 'time') write(first);
    else snap();
  });

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
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      unsubscribe?.();
      unsubscribe = undefined;
      stopPolicy();
      detachInputs();
      observer?.disconnect();
      target.style.removeProperty(property);
      listeners.clear();
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
