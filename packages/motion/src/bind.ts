import { deferredHandle, settledHandle } from './compose.js';
import type { MotionElement, MotionHandle, VisualFrame } from './contract.js';
import {
  definedMotions,
  kindOf,
  onMotionDefined,
  resolveMotion,
  validateMotionSpec,
  type MotionKind,
  type MotionName,
  type MotionRef,
  type MotionSpec,
} from './define-motion.js';
import { continuousModule, loadContinuous, loadText, textModule, type ContinuousApi } from './feature-loader.js';
import type { LayoutTracking } from './layout.js';
import { flushLayoutAround, layoutEngine, loadLayoutEngine } from './layout-loader.js';
import { moveFocusTo } from './focus.js';
import { playedSpec } from './named-motion.js';
import { NAME_PATTERN } from './manifest.js';
import { pinOutOfFlow } from './pin.js';
import { amplitudeOf } from './amplitude.js';
import { applyRestingFrame, distanceScaleOf, paintFrame, playMotion, releaseOwned } from './play.js';
import { getMotionRuntime, retainMotionRuntime, type MotionRuntime } from './runtime.js';
import { staggered } from './stagger.js';
import { isHtmlElement } from './svg-fields.js';
import { watchView } from './viewport.js';

/** A definition reference, a raw spec (validated here), or the name of a defined motion (registered names autocomplete). */
export type MotionSource = MotionRef | Readonly<MotionSpec> | MotionName;

/** A motion bound to an element, as `motion()` returns it: its presence, its replays and its cleanup. */
export interface MotionBinding {
  /** The handle of the motion that plays or played last (pause, reverse, seek), or null before the first one. */
  readonly handle: MotionHandle | null;
  /** Whether the element is present: false once an exit has started. */
  readonly present: boolean;
  /** The verb of the bound definition. */
  readonly verb: MotionSpec['verb'];
  /** The kind of the binding: `presence`, `emphasis`, `layout`, `view` (a reveal or a scrub) or `loop`. */
  readonly kind: MotionKind;
  /** Whether a loop is paused at the author's request; undefined for the other kinds. */
  readonly paused?: boolean;
  /**
   * Replay an emphasis, replay a reveal from its first frame, compare a layout and move it now, or resume a loop: the handle
   * of what plays. A scrub follows the scroll, so it plays nothing; a presence is shown or hidden with `setPresent`: both
   * return undefined, and development reports the call once per element.
   */
  play(): MotionHandle | undefined;
  /** Pause a loop, at the author's request (WCAG 2.2.2); `play()` resumes it. Refused for every other kind. */
  pause(): void;
  /**
   * Run the exit (`false`) or the entry (`true`) of a presence motion. Resolves to `'finished'` or `'cancelled'` and never
   * rejects: on a failure the element is left in its destination state.
   */
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  /**
   * Cancel the motion and release the inline state it wrote. The binding is then inert: `setPresent` resolves `'finished'` at
   * once, `play` returns a finished handle (undefined for a presence or a scrub, as before) and `pause` does nothing, without
   * touching the element (a call that does not apply to its kind still throws).
   */
  destroy(): void;
}

type Outcome = 'finished' | 'cancelled';
/** The options of `motion()` and `motionWhenDefined()`. */
export type BindOptions = {
  /**
   * Whether the element starts present: false binds it absent, so that `setPresent(true)` plays its entry.
   * @defaultValue true
   */
  present?: boolean;
  /**
   * Treat a present element as already in place: no entry plays when it is bound.
   * @defaultValue false
   */
  settled?: boolean;
  /**
   * Report mistakes on the console: an unknown name, an invalid spec, an exit that holds focus with no `restoreFocus`.
   * @defaultValue false
   */
  development?: boolean;
  /** The shared identity of a layout motion: the element morphs from the place of another element that held the same key. */
  shared?: string;
  /** A loop bound with `paused` starts paused (also when it is bound later, once its name is defined). */
  paused?: boolean;
  /**
   * Where focus goes when an exit starts with focus inside the element: an element, or a function that gives one when the exit
   * starts. Without one outside the element, the element stays focusable until focus leaves it.
   */
  restoreFocus?: Element | (() => Element | null | undefined);
  /**
   * The element has no box (`display: contents`, from a stylesheet): its motion goes to its box (`motionBox`). What an adapter
   * passes for a host it knows. An element whose own style says `display: contents`, or that carries `data-motion-box="child"`,
   * needs no option.
   * @defaultValue false
   */
  boxless?: boolean;
};
/** A spec with keyframes: a layout is bound by `createLayoutBinding` instead. */
type KeyframedSpec = Exclude<MotionSpec, { verb: 'layout' }>;

/** A layout follows HTML elements only: the layout engine measures the boxes of HTML. */
const LAYOUT_ON_SVG = 'A layout motion applies to an HTML element, not to an SVG element';

/** The kinds in the order `getMotion` and `getMotions` read them. */

/** The binding of each kind on an element: at most one per kind. */
const bindings = new WeakMap<Element, Map<MotionKind, MotionBinding>>();
/** The name a binding was made from, when it was made from a name or a definition. */
const names = new WeakMap<MotionBinding, string>();
/** The elements reported in development for an exit that holds focus with no restoreFocus outside them: once per element. */
const reportedFocus = new WeakSet<Element>();
/** The elements reported in development for two motions of one kind: once per element. */
const reportedKinds = new WeakSet<Element>();
/** The elements reported in development for a play() that plays nothing: once per element. */
const reportedPlays = new WeakSet<Element>();

/**
 * A play() that plays nothing: a presence is shown or hidden, and a scrub follows the scroll. Development reports it once per
 * element, a presence as an error and a scrub as a warning; production says nothing.
 * @returns undefined, what such a play() returns.
 */
export function reportPlay(target: Element, kind: 'presence' | 'scrub', development?: boolean): undefined {
  if (!development || reportedPlays.has(target)) return;
  reportedPlays.add(target);
  if (kind === 'presence') console.error('[@udixio/motion] play() plays nothing here: a presence is shown or hidden: use present or setPresent().');
  else console.warn('[@udixio/motion] play() plays nothing here: a scrub follows the scroll.');
}

/**
 * Report in development, once per element, a motion left out because the element already has one of its kind: `connectMotion`
 * and `motionsWhenDefined` keep the first listed name of each kind.
 */
export function reportSameKind(target: Element, ignored: string, kept: string, kind: MotionKind): void {
  if (reportedKinds.has(target)) return;
  reportedKinds.add(target);
  console.error(
    `[@udixio/motion] "${ignored}" ignored on an element that already has a ${kind} motion ("${kept}"): an element carries one motion of each kind, the first listed.`,
  );
}

/** The name a binding was made from, if it was made from a defined motion. */
export function nameOf(binding: MotionBinding): string | undefined {
  return names.get(binding);
}

function isRef(source: MotionRef | Readonly<MotionSpec>): source is MotionRef {
  return 'name' in source && 'spec' in source;
}

function specOf(source: MotionSource): Readonly<MotionSpec> {
  if (typeof source === 'string') {
    const ref = resolveMotion(source);
    if (!ref) throw new Error(`Unknown motion "${source}"`);
    return ref.spec;
  }
  return isRef(source) ? source.spec : validateMotionSpec(source);
}

/**
 * The binding of a kind on an element; without a kind, the one a play() without a kind plays: the first listed motion that is
 * not a presence, else the presence (see `listedTarget`).
 * @param target - The element.
 * @param kind - `presence`, `emphasis`, `layout`, `view` or `loop`.
 * @returns The binding, or undefined when the element holds none of that kind.
 */
export function getMotion(target: Element, kind?: MotionKind): MotionBinding | undefined {
  return listedTarget(getMotions(target), kind);
}

/**
 * The bindings of an element, at most one per kind, in the order their motions are listed: the order of a list of names
 * (`motionsWhenDefined`, `data-motion`) whatever the order in which the names are defined, else the order of the calls.
 * @param target - The element.
 */
export function getMotions(target: Element): MotionBinding[] {
  return [...(bindings.get(target)?.values() ?? [])];
}

/**
 * Put the bindings of an element in the order their motions are listed, which `getMotion` and `getMotions` follow: a name
 * defined after a name listed later is bound after it, and takes its listed place here. `motionsWhenDefined` and the scanner
 * call it when a name is defined; a binding that is no longer the element's own is passed.
 * @param target - The element.
 * @param listed - Its bindings, in the order their motions are listed.
 */
export function orderMotions(target: Element, listed: readonly (MotionBinding | undefined)[]): void {
  const kinds = bindings.get(target);
  for (const binding of listed) {
    if (binding && kinds?.get(binding.kind) === binding) {
      kinds.delete(binding.kind);
      kinds.set(binding.kind, binding);
    }
  }
}

/**
 * Whether an element is declared with no box, so that its motion goes to its box (TRIAL, review 5 Q3). Three signals, all read
 * without the computed style: its own style says `display: contents` (`style="display: contents"`: React's
 * `<Motion as={Component}>` wrapper, an Angular component's host); the binding says so (`boxless: true`, what an adapter passes
 * for a host it knows); or it carries `data-motion-box="child"` (HTML, a third-party wrapper, a component's host). An element
 * that is `display: contents` by a stylesheet only is not declared: it is its own box, and development says to declare it.
 * @param element - The element a motion is bound to.
 * @param boxless - The `boxless` option of the binding.
 * @returns True when the element is declared with no box.
 */
export function hasNoBox(element: Element, boxless = false): boolean {
  return boxless || (element as MotionElement).style?.display === 'contents' || element.getAttribute('data-motion-box') === 'child';
}

/**
 * The element a motion of `target` moves (TRIAL, review 5 Q3), its box: `target` itself, or, when it is declared with no box
 * (`hasNoBox`), its direct child marked `data-motion-box`, else its first element child, by the same rule again. A
 * declared element with no child is its own box.
 *
 * `data-motion-box` is one vocabulary: on the element, `"child"` says "my box is a child"; on a child of an element with no
 * box, the attribute (empty, or any other value) says "this is the box". The marker is read only on a direct child of an element
 * with no box. `"none"` is reserved for an element that has no box to give.
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
  if (__MOTION_CHECKS__ && !reportedUndeclared.has(box) && getComputedStyle(box).display === 'contents') {
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

/** An element as a development message names it: its tag, its id and its first classes. */
function elementLabel(element: Element): string {
  const id = element.id ? `#${element.id}` : '';
  const classes = Array.from(element.classList.values()).slice(0, 3).map(name => `.${name}`).join('');
  return `<${element.localName}${id}${classes}>`;
}

function register(target: Element, binding: MotionBinding): void {
  let kinds = bindings.get(target);
  if (!kinds) bindings.set(target, (kinds = new Map()));
  kinds.set(binding.kind, binding);
}

/** Forget a binding, if it is still the one registered for its kind. */
function unregister(target: Element, binding: MotionBinding): void {
  const kinds = bindings.get(target);
  if (kinds?.get(binding.kind) !== binding) return;
  kinds.delete(binding.kind);
  if (kinds.size === 0) bindings.delete(target);
}

/**
 * Bind a motion to an element. The binding owns its presence (`data-motion-presence`, `inert`),
 * its replays and its cleanup. An element carries one motion of each kind: a call with a motion of a
 * kind the element already holds replaces it, destroying the old binding (which is then inert); the
 * bindings of the other kinds are kept. A list of names is not a series of calls: `motionsWhenDefined`
 * and `connectMotion` keep the first listed name of each kind.
 * @param target - The element to animate: an HTML or SVG element.
 * @param source - A defined name, a definition from `defineMotion`, or a raw spec.
 * @param options - The initial presence, the settling, the shared key, the pause and the focus target.
 * @returns The binding: `setPresent`, `play`, `pause`, `destroy`.
 */
export function motion(host: MotionElement, source: MotionSource, options: BindOptions = {}): MotionBinding {
  const spec = specOf(source);
  // An element with no box delegates its motion to its box; the binding is found from both. A host the server marked present
  // (an Angular host) is settled as its box would be.
  const target = motionBox(host, options.boxless);
  if (target !== host && host.getAttribute('data-motion-presence') === 'present') options = { ...options, settled: options.settled ?? true };
  // Refused before the binding it would replace is destroyed.
  if (spec.verb === 'layout' && !isHtmlElement(target)) throw new TypeError(LAYOUT_ON_SVG);
  getMotion(target, kindOf(spec.verb))?.destroy();
  // A split definition needs the text module: it loads now, and a failure leaves the element to animate whole.
  if (spec.split !== undefined) void loadText().catch(() => undefined);
  const binding =
    spec.verb === 'layout'
      ? createLayoutBinding(target, spec, options)
      : spec.verb === 'reveal'
        ? createRevealBinding(target, spec, options)
        : spec.verb === 'scrub' || spec.verb === 'loop'
          ? createContinuousBinding(target, spec, options)
          : createBinding(target, spec, options);
  register(target, binding);
  if (target !== host) bindings.set(host, bindings.get(target)!);
  const name = typeof source === 'string' ? source : isRef(source) ? source.name : undefined;
  if (name !== undefined) names.set(binding, name);
  return binding;
}

/** A motion that is bound, or waits for its name to be defined. */
export interface DeferredMotion {
  /** The binding, once the motion is defined. */
  readonly binding: MotionBinding | undefined;
  /** Whether the motion waits for its name to be defined: true until `defineMotion` defines it, or until `destroy()`. */
  readonly pending: boolean;
  /**
   * Set the presence of the element: `setPresent` of the binding when it is a presence motion, else nothing. Asked before the
   * name is defined, the last value is kept and applied when the motion is defined; resolves at once in that case.
   */
  setPresent(present: boolean): Promise<'finished' | 'cancelled'>;
  /**
   * The binding's `play()`, when the binding is of `kind` or no kind is given. Asked before the name is defined, it returns
   * undefined and plays once the motion is defined, if it is of that kind (as `playListed` does with a list of one).
   */
  play(kind?: MotionKind): MotionHandle | undefined;
  /** Destroy the binding, or stop waiting for the name to be defined. */
  destroy(): void;
}

/** The outcome of a presence that has nothing to wait for: already settled, and shared. */
const settled = Promise.resolve<'finished' | 'cancelled'>('finished');

/**
 * The binding of a list that a play(kind?) targets: with a kind, the binding of that kind; without one, the first listed that
 * is not a presence, else the presence, whose `play()` plays nothing. A motion not defined yet, or left out for its kind, has
 * no binding and is passed. `getMotion`, the scanner's `data-motion-state`, `playListed` and the adapters' `getBinding` follow it.
 * @param bindings - The bindings of an element, in the order their motions are listed.
 * @param kind - The kind to find.
 * @returns The binding play() plays, or undefined when the list binds nothing that matches.
 */
export function listedTarget(bindings: readonly (MotionBinding | undefined)[], kind?: MotionKind): MotionBinding | undefined {
  return kind
    ? bindings.find(binding => binding?.kind === kind)
    : (bindings.find(binding => binding && binding.kind !== 'presence') ?? bindings.find(Boolean));
}

/** The plays asked of a list before the motion they target was defined, on each motion of the list that waits for its name. */
const waitingPlays = new WeakMap<DeferredMotion, { motions: readonly DeferredMotion[]; kind?: MotionKind }>();

/**
 * Play a list of motions, as `motionsWhenDefined` returns it, the target that `listedTarget` names: with a kind, the binding
 * of that kind; without one, the first listed motion that is not a presence, else the presence, whose `play()` plays nothing.
 * When nothing bound matches (no binding of that kind, or only a presence) while a listed name is not defined yet, the play
 * waits: it is asked again each time one of those names is defined, and plays once something matches, or once every name is
 * known. Asked again meanwhile, it still plays once. The framework adapters' `play(kind?)` and `state` call it.
 * @param motions - The motions of an element, in the order they are listed.
 * @param kind - The kind to play.
 * @returns The handle of what plays, or undefined (also while the play waits).
 */
export function playListed(motions: readonly DeferredMotion[], kind?: MotionKind): MotionHandle | undefined {
  const target = listedTarget(motions.map(each => each.binding), kind);
  const waiting = motions.filter(each => each.pending);
  for (const each of motions) waitingPlays.delete(each);
  if (waiting.length && (!target || (!kind && target.kind === 'presence'))) {
    for (const each of waiting) waitingPlays.set(each, { motions, kind });
    return undefined;
  }
  return target?.play();
}

/**
 * Bind a motion now when its source is known, or as soon as the named motion is defined. Until then the
 * element is not touched, so a render that runs before the definition never throws.
 * @param target - The element to animate.
 * @param source - A name, which may not be defined yet, a definition or a raw spec.
 * @param options - As for `motion()`.
 * @returns A binding that waits: its `binding` is undefined until the name is defined.
 */
export function motionWhenDefined(target: MotionElement, source: MotionSource, options: BindOptions = {}): DeferredMotion {
  return motionsWhenDefined(target, [source], options)[0];
}

/**
 * Bind a list of motions to an element, each now or once its name is defined, as `motionWhenDefined` does. An element carries
 * one motion of each kind: of the sources of a kind, the first listed is bound, whatever the order in which the names are
 * defined, and the others are left unbound and reported in development. A name defined after a source listed later that holds
 * its kind takes the kind over: that binding is destroyed. The framework adapters bind their lists with it.
 * @param target - The element to animate.
 * @param sources - The names, definitions or raw specs, in order.
 * @param options - As for `motion()`, for each source.
 * @returns One motion per source, in order: a source left out has no `binding`, and its calls do nothing.
 */
export function motionsWhenDefined(target: MotionElement, sources: readonly MotionSource[], options: BindOptions = {}): DeferredMotion[] {
  /** The kind of each source whose motion is known, kept or not. */
  const kinds: (MotionKind | undefined)[] = [];
  const label = (source: MotionSource): string => (typeof source === 'string' ? source : isRef(source) ? source.name : `a ${source.verb} spec`);
  const listed: (DeferredMotion & { drop(): void; rebind(): void })[] = sources.map((source, index) =>
    deferMotion(target, source, options, () => listed, verb => {
      const kind = kindOf(verb);
      kinds[index] = kind;
      const first = kinds.indexOf(kind);
      if (first < index) {
        if (options.development) reportSameKind(target, label(source), label(sources[first]), kind);
        return false;
      }
      // A source listed later that holds the kind gives it way.
      kinds.forEach((each, later) => {
        if (later <= index || each !== kind || !listed[later].binding) return;
        if (options.development) reportSameKind(target, label(sources[later]), label(source), kind);
        listed[later].drop();
      });
      return true;
    }, () => observer?.disconnect()),
  );
  // An element with no box follows its box: a new root rendered in place of the old one takes the motions, settled.
  let box = motionBox(target, options.boxless);
  const observer = !hasNoBox(target, options.boxless)
    ? undefined
    : new MutationObserver(() => {
          const next = motionBox(target, options.boxless);
          if (next === box) return;
          box = next;
          for (const each of listed) each.rebind();
        });
  observer?.observe(target, { childList: true, subtree: true });
  return listed;
}

/**
 * One motion of `motionsWhenDefined`: `listOf` gives its list, `admit` says whether it binds once its verb is known, and `drop`
 * unbinds it.
 */
function deferMotion(
  target: MotionElement,
  source: MotionSource,
  options: BindOptions,
  listOf: () => readonly DeferredMotion[],
  admit: (verb: MotionSpec['verb']) => boolean,
  release: () => void,
): DeferredMotion & { drop(): void; rebind(): void } {
  let binding: MotionBinding | undefined;
  let unsubscribe: (() => void) | undefined;
  // The presence asked for: the options' one until it changes.
  const initial = options.present !== false;
  let wanted = initial;
  let pending = false;
  if (typeof source === 'string' && !resolveMotion(source)) {
    const name = source;
    pending = true;
    if (options.development) console.error(`[@udixio/motion] Unknown motion "${name}". Defined: ${definedMotions().join(', ')}`);
    unsubscribe = onMotionDefined(ref => {
      if (ref.name !== name) return;
      unsubscribe?.();
      pending = false;
      if (admit(ref.spec.verb)) {
        binding = motion(target, ref, { ...options, present: wanted || initial, settled: true });
        // A presence asked to end meanwhile ends now, with its exit, as if the definition had been there.
        if (!wanted && initial && binding.kind === 'presence') void binding.setPresent(false);
      }
      settle();
    });
  } else if (admit(typeof source === 'string' ? resolveMotion(source)!.spec.verb : isRef(source) ? source.spec.verb : source.verb)) {
    binding = motion(target, source, options);
  }
  const self: DeferredMotion & { drop(): void; rebind(): void } = {
    get binding() {
      return binding;
    },
    get pending() {
      return pending;
    },
    setPresent(present) {
      if (!binding) wanted = present;
      return binding?.kind === 'presence' ? binding.setPresent(present) : settled;
    },
    play(kind) {
      return playListed([self], kind);
    },
    destroy() {
      unsubscribe?.();
      release();
      pending = false;
      waitingPlays.delete(self);
      binding?.destroy();
    },
    drop() {
      binding?.destroy();
      binding = undefined;
    },
    rebind() {
      if (!binding) return;
      const present = binding.present;
      binding.destroy();
      binding = motion(target, source, { ...options, present, settled: true });
    },
  };
  /** The list order once a name is defined, and a play that waited for it, asked again. */
  function settle(): void {
    orderMotions(target, listOf().map(each => each.binding));
    const asked = waitingPlays.get(self);
    if (asked) playListed(asked.motions, asked.kind);
  }
  return self;
}

/**
 * A layout follows its element: it writes no presence attribute and never enters or leaves. The layout engine is
 * loaded on first use: until it is, the element is not followed, and it starts following from its place once loaded.
 * Its shared identity is the option `shared`, else the one of its definition; an element with none holds no identity.
 */
function createLayoutBinding(target: MotionElement, spec: Readonly<MotionSpec>, options: BindOptions): MotionBinding {
  if (!isHtmlElement(target)) throw new TypeError(LAYOUT_ON_SVG);
  const shared = options.shared ?? spec.shared;
  if (shared !== undefined && !NAME_PATTERN.test(shared)) throw new TypeError(`Shared identity "${shared}" must be kebab-case`);
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const trackOptions = { runtime, development: options.development ?? false, shared };
  let destroyed = false;
  const engine = layoutEngine();
  let tracking: LayoutTracking | undefined = engine?.trackLayout(target, spec, trackOptions);
  if (!engine) {
    // A failed load leaves the element unfollowed: it stays where it is, and the page is not affected.
    void loadLayoutEngine().then(
      () => {
        if (!destroyed) tracking = layoutEngine()?.trackLayout(target, spec, trackOptions);
      },
      () => {},
    );
  }
  // Under reduced motion, a move in flight stops where the layout puts the element.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (runtime.policy.reduced) tracking?.handle?.cancel();
  });
  const binding: MotionBinding = {
    verb: 'layout',
    kind: 'layout',
    get handle() {
      return tracking?.handle ?? null;
    },
    get present() {
      return true;
    },
    play() {
      if (destroyed) return settledHandle();
      tracking?.flush();
      return tracking?.handle ?? settledHandle();
    },
    pause() {
      throw new TypeError('pause applies to a loop motion');
    },
    setPresent() {
      throw new TypeError('setPresent does not apply to a layout motion');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      tracking?.destroy();
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

/** A split definition on the pieces of its text when the text module is loaded, else on the element whole. */
function playLoaded(target: MotionElement, spec: Readonly<KeyframedSpec>, options: Parameters<typeof playMotion>[2]): MotionHandle {
  return textModule()?.playSplit(target, spec, options) ?? playMotion(target, spec, options);
}

/**
 * The entry of a split definition on the pieces of its text, once the text module is loaded. While the module is still
 * loading, the element holds its first frame and the entry waits for the module; if the module fails to load, the entry
 * plays the element whole.
 */
function playEntry(target: MotionElement, spec: Readonly<KeyframedSpec>, options: Parameters<typeof playMotion>[2]): MotionHandle {
  if (textModule()) return playLoaded(target, spec, options);
  const pending = deferredHandle();
  paintFrame(target, amplitudeOf(spec.keyframes[0], distanceScaleOf(target, options.runtime.policy.reduced)), kindOf(spec.verb));
  // A failed load leaves the module unloaded, so the entry plays the element whole.
  void loadText().catch(() => undefined).then(() => {
    if (!pending.cancelled) pending.resolve(playLoaded(target, spec, options));
  });
  return pending.handle;
}

/**
 * Write a frame where the definition plays it: on the pieces of its text when it is split, else on the element. A resting
 * frame, a state the element stays in, releases its neutral fields to the stylesheet.
 */
function writeFrame(target: MotionElement, spec: Readonly<KeyframedSpec>, runtime: MotionRuntime, frame: VisualFrame, resting = false): void {
  // A frame is written at the distance its motion plays, so that a hidden start is where the motion begins.
  const shaped = amplitudeOf(frame, distanceScaleOf(target, runtime.policy.reduced));
  const text = textModule();
  if (text) text.applySplitFrame(target, spec, runtime, shaped, resting);
  else if (resting) applyRestingFrame(target, shaped, kindOf(spec.verb));
  else paintFrame(target, shaped, kindOf(spec.verb));
}

/** The fields a keyframed definition writes: its keyframes' fields, and opacity for a presence, whose reduced render is a fade. */
function fieldsOf(spec: Readonly<KeyframedSpec>): Set<keyof VisualFrame> {
  const fields = new Set<keyof VisualFrame>(spec.keyframes.flatMap(frame => Object.keys(frame) as (keyof VisualFrame)[]));
  if (spec.verb === 'appear' || spec.verb === 'disappear') fields.add('opacity');
  return fields;
}

/** The frame a presence enters through: an appear enters through its last frame, a disappear through its first. */
function enteredFrame(spec: Readonly<KeyframedSpec>): VisualFrame {
  return spec.verb === 'disappear' ? spec.keyframes[0] : spec.keyframes[spec.keyframes.length - 1];
}

/** The frame a presence leaves through: the reverse of `enteredFrame`. */
function exitedFrame(spec: Readonly<KeyframedSpec>): VisualFrame {
  return spec.verb === 'disappear' ? spec.keyframes[spec.keyframes.length - 1] : spec.keyframes[0];
}

/**
 * The inline fields a keyframed binding has written, across the definitions it plays. `--udx-motion` may name another
 * definition at each trigger, so a play releases the fields that an earlier play wrote and it does not write: no field of
 * a definition outlives the play that wrote it. `release` gives back every field the binding wrote, at its destruction.
 */
function writesOf(target: MotionElement, bound: Readonly<KeyframedSpec>, development: boolean) {
  const owner = kindOf(bound.verb);
  const written = fieldsOf(bound);
  const played = new Set<Readonly<KeyframedSpec>>([bound]);
  return {
    /** The definition the next play uses, read now; the fields that earlier plays wrote and it does not write are released. */
    use(): Readonly<KeyframedSpec> {
      const spec = playedSpec(target, bound, development);
      const fields = fieldsOf(spec);
      releaseOwned(target, [...written].filter(field => !fields.has(field)), owner);
      for (const field of fields) written.add(field);
      played.add(spec);
      return spec;
    },
    release(): void {
      releaseOwned(target, written, owner);
      for (const spec of played) textModule()?.revertSplit(target, spec);
    },
  };
}

/**
 * A reveal: out of view, the element waits in its first frame; when it enters the view, it plays forward from there.
 * Content in view when it is bound is left in its natural state. `repeat: 'always'` hides it again when it leaves
 * the view; by default it is revealed once, and the view is no longer watched after that.
 */
function createRevealBinding(target: MotionElement, spec: Readonly<Extract<MotionSpec, { verb: 'reveal' }>>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const once = spec.repeat !== 'always';
  const writes = writesOf(target, spec, development);
  let revealed = false;
  let handle: MotionHandle | null = null;
  let initial = true;
  let destroyed = false;
  let watching = true;
  let unwatch: (() => void) | undefined;

  function stopWatching() {
    watching = false;
    unwatch?.();
    unwatch = undefined;
  }

  /** Put the element back in the first frame of `active`, out of sight, and stop what plays. */
  function hide(active: Readonly<KeyframedSpec>) {
    handle?.cancel();
    handle = null;
    writeFrame(target, active, runtime, active.keyframes[0]);
    revealed = false;
  }

  function markRevealed() {
    revealed = true;
    if (once) stopWatching();
  }

  /** Play `active` forward from its first frame, in the cascade of the definition when it staggers. */
  function start(active: Readonly<KeyframedSpec>): MotionHandle {
    const play = (delay: number) => playMotion(target, active, { direction: 'forward', carry: false, runtime, development, delay });
    const next = active.split !== undefined
      ? playEntry(target, active, { direction: 'forward', carry: false, runtime, development })
      : active.stagger === undefined ? play(0) : staggered(target, active, { stagger: active.stagger, origin: active.origin, reduced: runtime.policy.reduced, phase: 'enter' }, play);
    const previous = handle;
    handle = next;
    previous?.cancel();
    return next;
  }

  function onView(inView: boolean) {
    if (destroyed) return;
    if (initial) {
      initial = false;
      // Content in view stays in its natural state; content out of view waits in its first frame.
      if (inView) markRevealed();
      else {
        const active = writes.use();
        writeFrame(target, active, runtime, active.keyframes[0]);
      }
      return;
    }
    if (inView && !revealed) {
      markRevealed();
      start(writes.use());
    } else if (!inView && revealed && !once) {
      hide(writes.use());
    }
  }

  const stop = watchView(target, spec.axis ?? 'block', onView);
  if (watching) unwatch = stop;
  else stop();

  // Under reduced motion, a reveal that runs jumps to its end, as a presence motion does.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (handle && runtime.policy.reduced) handle.seek(handle.delay + handle.duration);
  });

  const binding: MotionBinding = {
    verb: 'reveal',
    kind: 'view',
    get handle() {
      return handle;
    },
    get present() {
      return revealed;
    },
    play() {
      if (destroyed) return settledHandle();
      const active = writes.use();
      hide(active);
      markRevealed();
      return start(active);
    },
    pause() {
      throw new TypeError('pause applies to a loop motion');
    },
    setPresent() {
      throw new TypeError('setPresent does not apply to a reveal motion');
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopPolicy();
      stopWatching();
      handle?.cancel();
      handle = null;
      writes.release();
      unregister(target, binding);
      releaseRuntime();
    },
  };
  return binding;
}

/**
 * A scrub or a loop: its code is the continuous module, loaded the first time one is bound. Until it is loaded, the element
 * keeps its stylesheet state, and a play or a pause asked meanwhile is applied once the binding exists (the last one asked
 * wins). A failed load leaves the element in its stylesheet state, and a later bind tries again.
 */
function createContinuousBinding(target: MotionElement, spec: Readonly<Extract<MotionSpec, { verb: 'scrub' | 'loop' }>>, options: BindOptions): MotionBinding {
  let inner: MotionBinding | undefined;
  let requested: 'play' | 'pause' | undefined;
  let destroyed = false;

  /** Bind the spec with the continuous module, then apply the request made before it was loaded. */
  const bindWith = (api: ContinuousApi): void => {
    inner = spec.verb === 'scrub' ? api.createScrubBinding(target, spec, options) : api.createLoopBinding(target, spec, options);
    if (requested === 'pause') inner.pause();
    else if (requested === 'play') inner.play();
  };
  const loaded = continuousModule();
  if (loaded) bindWith(loaded);
  else {
    void loadContinuous().then(
      () => {
        const api = continuousModule();
        if (api && !destroyed) bindWith(api);
      },
      () => {},
    );
  }

  const binding: MotionBinding = {
    verb: spec.verb,
    kind: kindOf(spec.verb),
    get handle() {
      return inner?.handle ?? null;
    },
    get present() {
      return true;
    },
    // Until the module loads, a pause asked is the state the loop is in.
    get paused() {
      return inner?.paused ?? requested === 'pause';
    },
    play() {
      if (spec.verb === 'scrub') return reportPlay(target, 'scrub', options.development);
      if (destroyed) return settledHandle();
      requested = 'play';
      return inner?.play() ?? settledHandle();
    },
    pause() {
      if (spec.verb !== 'loop') throw new TypeError('pause applies to a loop motion');
      if (destroyed) return;
      requested = 'pause';
      inner?.pause();
    },
    setPresent() {
      throw new TypeError(`setPresent does not apply to a ${spec.verb} motion`);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      inner?.destroy();
      unregister(target, binding);
    },
  };
  return binding;
}

function createBinding(target: MotionElement, spec: Readonly<KeyframedSpec>, options: BindOptions): MotionBinding {
  const development = options.development ?? false;
  const runtime = getMotionRuntime();
  const releaseRuntime = retainMotionRuntime(runtime);
  const verb = spec.verb;
  const writes = writesOf(target, spec, development);

  let present = verb === 'emphasize' || options.present !== false;
  let handle: MotionHandle | null = null;
  let outcome: Promise<Outcome> = Promise.resolve('finished');
  let ownsInert = false;
  // Set while an exit that starts with focus inside waits for focus to leave the element: calling it stops the wait.
  let stopWaiting: (() => void) | undefined;
  // Set while an out-of-flow exit takes the element out of the flow: calling it puts the element back.
  let unpin: (() => void) | undefined;
  let destroyed = false;

  /** Make `next` the current motion. Call it after `playMotion`, so the old handle stops once the new one runs. */
  function replace(next: MotionHandle): MotionHandle {
    const previous = handle;
    handle = next;
    previous?.cancel();
    return next;
  }

  /** Record the presence outcome. A finished entry marks the element present, and a finished exit makes it inert, while each is current. */
  function track(next: MotionHandle, arriving: boolean): Promise<Outcome> {
    outcome = next.finished.then(result => {
      if (result !== 'finished' || handle !== next) return result;
      if (arriving) target.setAttribute('data-motion-presence', 'present');
      else if (!present) setInert();
      return result;
    });
    return outcome;
  }

  function releaseInert() {
    stopWaiting?.();
    stopWaiting = undefined;
    if (!ownsInert) return;
    target.removeAttribute('inert');
    ownsInert = false;
  }

  /** Put the element back into the flow, if an out-of-flow exit took it out: its neighbours make room again. */
  function returnToFlow() {
    if (!unpin) return;
    unpin();
    unpin = undefined;
    if (isHtmlElement(target)) flushLayoutAround(target);
  }

  /** Sets inert unless the author set it, and ends the wait for focus to leave the element if one runs. */
  function setInert() {
    stopWaiting?.();
    stopWaiting = undefined;
    if (target.hasAttribute('inert')) return;
    target.setAttribute('inert', '');
    ownsInert = true;
  }

  /**
   * An exit that starts with focus inside the element keeps it focusable: inert is set once focus leaves it, or when the exit
   * ends. Without a restore target outside the element, development reports it once per element.
   */
  function waitForFocusToLeave() {
    if (development && !reportedFocus.has(target)) {
      reportedFocus.add(target);
      console.warn(
        '[@udixio/motion] A presence exit started with focus inside the element and no restoreFocus outside it: the element stays focusable until focus leaves it. Pass restoreFocus to move focus where it belongs.',
      );
    }
    const onFocusOut = (event: Event) => {
      if (!target.contains((event as FocusEvent).relatedTarget as Node | null)) setInert();
    };
    target.addEventListener('focusout', onFocusOut);
    stopWaiting = () => target.removeEventListener('focusout', onFocusOut);
  }

  function markExiting() {
    present = false;
    target.setAttribute('data-motion-presence', 'exiting');
    if (target.hasAttribute('inert')) return;
    if (target.matches(':focus-within')) waitForFocusToLeave();
    else setInert();
  }

  /** Play the presence motion `active`: at once, or in the cascade of its definition when it staggers. */
  function playPresence(active: Readonly<KeyframedSpec>, phase: 'enter' | 'exit', direction: 'forward' | 'backward', carry: boolean): MotionHandle {
    // An entry of a split definition waits for the text module; an exit does not, so that a removal is never delayed by a load.
    if (active.split !== undefined) {
      const options = { direction, carry, runtime, development };
      return phase === 'enter' ? playEntry(target, active, options) : playLoaded(target, active, options);
    }
    if (active.stagger === undefined) return playMotion(target, active, { direction, carry, runtime, development });
    return staggered(target, active, { stagger: active.stagger, origin: active.origin, reduced: runtime.policy.reduced, phase }, delay =>
      playMotion(target, active, { direction, carry, runtime, development, delay }),
    );
  }

  function enter(active: Readonly<KeyframedSpec>, carry: boolean): Promise<Outcome> {
    present = true;
    releaseInert();
    returnToFlow();
    target.setAttribute('data-motion-presence', 'entering');
    return track(replace(playPresence(active, 'enter', 'forward', carry)), true);
  }

  /** A disappear enters at once; the running exit is cancelled before the inline write. */
  function enterAtOnce(active: Readonly<KeyframedSpec>): Promise<Outcome> {
    present = true;
    releaseInert();
    returnToFlow();
    const done = track(replace(settledHandle()), false);
    writeFrame(target, active, runtime, enteredFrame(active), true);
    target.setAttribute('data-motion-presence', 'present');
    return done;
  }

  function exit(active: Readonly<KeyframedSpec>): Promise<Outcome> {
    // Focus held inside moves to the restore target before the element goes inert, so inert never takes it from the element. A
    // target that cannot take focus gets tabindex -1 for the move only.
    const { restoreFocus } = options;
    const to = target.matches(':focus-within') && (typeof restoreFocus === 'function' ? restoreFocus() : restoreFocus);
    if (to) moveFocusTo(to);
    markExiting();
    // An out-of-flow exit takes the element out of the flow now, so that its neighbours close the gap as it fades.
    if (active.exit === 'out-of-flow' && isHtmlElement(target) && !runtime.policy.reduced && unpin === undefined) {
      unpin = pinOutOfFlow(target);
      flushLayoutAround(target);
    }
    const direction = active.verb === 'disappear' ? 'forward' : 'backward';
    return track(replace(playPresence(active, 'exit', direction, true)), false);
  }

  function setPresent(next: boolean): Promise<Outcome> {
    if (verb === 'emphasize') throw new TypeError('setPresent does not apply to an emphasis; use play()');
    if (destroyed) return settled;
    if (next === present) return outcome;
    const active = writes.use();
    if (!next) return exit(active);
    return active.verb === 'disappear' ? enterAtOnce(active) : enter(active, true);
  }

  function play(): MotionHandle | undefined {
    if (verb !== 'emphasize') return reportPlay(target, 'presence', development);
    if (destroyed) return settledHandle();
    const active = writes.use();
    return replace(playMotion(target, active, { direction: 'forward', carry: active.interrupt === 'carry', runtime, development }));
  }

  function pause(): void {
    throw new TypeError('pause applies to a loop motion');
  }

  // Under reduced motion, the running animation jumps to its end.
  const stopPolicy = runtime.policy.subscribe(() => {
    if (handle && runtime.policy.reduced) handle.seek(handle.delay + handle.duration);
  });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stopPolicy();
    handle?.cancel();
    handle = null;
    const pinned = unpin !== undefined;
    unpin?.();
    unpin = undefined;
    writes.release();
    target.removeAttribute('data-motion-presence');
    releaseInert();
    unregister(target, binding);
    // A pinned element that stays in the page is back in the flow: its neighbours make room again.
    if (pinned && target.isConnected && isHtmlElement(target)) flushLayoutAround(target);
    releaseRuntime();
  }

  // Initial state. An emphasis waits for play(). `settled` only skips the entry of a present element:
  // an absent element always takes its exited frame, so it is never visible. Without an explicit `settled`, an element the
  // server marked present is settled: its content is in place, and hydration does not replay its entry.
  if (verb !== 'emphasize') {
    const active = writes.use();
    if (!present) {
      // Under reduced motion the absent element keeps the state it has while present: only its opacity is hidden.
      const exited = exitedFrame(active);
      if (runtime.policy.reduced) writeFrame(target, active, runtime, { ...enteredFrame(active), opacity: exited.opacity }, true);
      else writeFrame(target, active, runtime, exited);
      markExiting();
    } else if (options.settled ?? target.getAttribute('data-motion-presence') === 'present') {
      target.setAttribute('data-motion-presence', 'present');
    } else if (active.verb === 'disappear') {
      enterAtOnce(active);
    } else {
      enter(active, false);
    }
  }

  const binding: MotionBinding = {
    get handle() {
      return handle;
    },
    get present() {
      return present;
    },
    verb,
    kind: kindOf(verb),
    play,
    pause,
    setPresent,
    destroy,
  };
  return binding;
}
