import { getMotion, motion, replayable, type MotionBinding } from './bind.js';
import { definedMotions, kindOf, onMotionDefined, resolveMotion, type MotionKind, type MotionRef } from './define-motion.js';
import {
  gesturesModule,
  loadGestures,
  loadSequences,
  loadValues,
  sequencesModule,
  valuesModule,
  type GestureApi,
  type SequenceApi,
  type ValueApi,
} from './feature-loader.js';
import type { GestureBinding } from './gesture-binding.js';
import type { MotionElement } from './contract.js';
import { releaseHiddenHold, setPresentByHidden } from './hidden-presence.js';
import { NAME_PATTERN } from './manifest.js';
import { onGestureDefined, onSequenceDefined, onValueDefined, resolveGesture, resolveSequence, resolveValue } from './registries.js';
import type { SequenceBinding } from './sequence.js';
import { isHtmlElement } from './svg-fields.js';
import type { ValueBinding } from './value-binding.js';

/** The options of `connectMotion()`. */
export interface ConnectOptions {
  /**
   * The subtree whose `data-motion`, `data-motion-value` and `data-motion-gesture` elements are bound and followed.
   * @defaultValue document
   */
  root?: Document | Element;
  /**
   * Report an unknown name or an invalid attribute on the console; the element is bound once the name is defined.
   * @defaultValue false
   */
  development?: boolean;
}

/** The scanners connected on this page, with their roots: `stopScanning` acts on those that cover a subtree. */
const scanners = new Set<{ readonly root: Document | Element; disconnect(): void; suspend(scope: Element): void }>();

/**
 * Stop the scanners of the page within `scope`, for `revert`: a scanner rooted inside `scope` is disconnected, and a scanner
 * that covers `scope` stops observing it. A scanner connected afterwards binds it again.
 */
export function stopScanning(scope: Element): void {
  for (const scanner of [...scanners]) {
    if (scope.contains(scanner.root)) scanner.disconnect();
    else if (scanner.root.contains(scope)) scanner.suspend(scope);
  }
}

/** A motion the scanner bound on an element: the name it came from, and its binding. */
type Owned = { name: string; binding: MotionBinding };

/** Whether an element can carry motions: an HTML or an SVG element, as its own window knows them. */
function motionable(el: Element): el is MotionElement {
  const view = el.ownerDocument.defaultView ?? window;
  return el instanceof view.HTMLElement || el instanceof view.SVGElement;
}

/** The elements under `node`, the node itself included, that carry `data-motion`, `data-motion-value` or `data-motion-gesture`. */
function scannedElements(node: Node): MotionElement[] {
  const selector = '[data-motion], [data-motion-value], [data-motion-gesture]';
  const within = node instanceof Element || node instanceof Document ? [...node.querySelectorAll(selector)] : [];
  return [...(node instanceof Element && node.matches(selector) ? [node] : []), ...within].filter(motionable);
}

/** The names listed in the `data-motion` of an element, in order. */
function namesOf(el: Element): string[] {
  return (el.getAttribute('data-motion') ?? '').split(/\s+/).filter(Boolean);
}

/** The names listed in the `data-motion-value` of an element, in order. */
function valueNamesOf(el: Element): string[] {
  return (el.getAttribute('data-motion-value') ?? '').split(/\s+/).filter(Boolean);
}

/** The gesture named by the `data-motion-gesture` of an element; an empty attribute names none. */
function gestureNameOf(el: Element): string {
  return (el.getAttribute('data-motion-gesture') ?? '').trim();
}

/**
 * Where focus goes when an exit starts with focus inside `el`: the element that `data-motion-restore-focus` selects, looked up in
 * the document when the exit starts. A selector that matches nothing, or an element inside `el`, gives no target; an invalid
 * selector is reported in development.
 */
function restoreFocusOf(el: MotionElement, development: boolean): () => Element | null {
  return () => {
    const selector = el.getAttribute('data-motion-restore-focus')?.trim();
    if (!selector) return null;
    let target: Element | null;
    try {
      target = el.ownerDocument.querySelector(selector);
    } catch {
      if (development) console.error(`[@udixio/motion] data-motion-restore-focus="${selector}" is not a valid selector: focus does not move.`);
      return null;
    }
    return target && !el.contains(target) ? target : null;
  };
}

/**
 * The shared identity of an element: its `data-motion-shared`, when it is a kebab-case key. An empty value is no
 * key; an invalid one is reported (in development) and ignored, so that one bad attribute never stops the scan.
 */
function sharedOf(el: Element, development: boolean): string | undefined {
  const value = el.getAttribute('data-motion-shared');
  if (!value) return undefined;
  if (NAME_PATTERN.test(value)) return value;
  if (development) {
    console.error(`[@udixio/motion] data-motion-shared="${value}" is not a kebab-case key: the element is bound without a shared identity.`);
  }
  return undefined;
}

/**
 * Bind the `[data-motion]` elements under `root` and keep the bindings in step with the DOM:
 * an insertion plays its entry, a removal destroys, and `data-motion`, `data-state` and `hidden`
 * drive the motion. While `data-motion-paused` is set, the loop of the element is paused. An element may
 * list several motions, one per kind. A `data-motion-shared` gives the layout motion of the element a shared
 * identity: it morphs from the place of another element with the same key. A `data-motion-value` binds the named values
 * of the element, each written as a variable there. A `data-motion` name that is a defined sequence binds the sequence
 * on the element; its `data-motion-step` children need no scanning of their own. A `data-motion-gesture` binds the gesture
 * it names on the element. A `data-motion-restore-focus="<selector>"` names the element focus moves to when an exit starts with
 * focus inside it. The values, the sequences and the gestures are loaded the first time a page meets one of them.
 * The returned function disconnects the scanner and destroys its bindings.
 * @param options - The root to scan, and the development reports.
 * @returns A function that disconnects the scanner and destroys its bindings.
 */
export function connectMotion(options: ConnectOptions = {}): () => void {
  const root = options.root ?? document;
  const development = options.development ?? false;
  /** The motions the scanner bound on each element, by kind. */
  const bound = new Map<MotionElement, Map<MotionKind, Owned>>();
  /** The sequences the scanner bound on each element. */
  const boundSequences = new Map<MotionElement, SequenceBinding>();
  const pending = new Map<string, Set<MotionElement>>();
  /** The values the scanner bound on each element, by name; and the elements waiting for each undefined name. */
  const boundValues = new Map<MotionElement, Map<string, ValueBinding>>();
  const pendingValues = new Map<string, Set<MotionElement>>();
  /** The gesture the scanner bound on each element; and the elements waiting for each undefined gesture name. */
  const boundGestures = new Map<MotionElement, GestureBinding>();
  const pendingGestures = new Map<string, Set<MotionElement>>();
  const reported = new Set<string>();
  const reportedValues = new Set<string>();
  const reportedGestures = new Set<string>();
  const conflicts = new WeakSet<MotionElement>();
  /** The SVG elements a layout motion was refused on, warned about once each. */
  const refusedLayouts = new WeakSet<MotionElement>();
  /** False once the scanner is disconnected: a module that loads after that binds nothing. */
  let live = true;
  /** The subtrees `stopScanning` released: the scanner does not bind inside them. */
  const suspended = new WeakSet<Element>();

  /** Whether `el` is in a subtree that `stopScanning` released, or in one of its ancestors. */
  function suspendedAt(el: Element): boolean {
    for (let node: Element | null = el; node; node = node.parentElement) if (suspended.has(node)) return true;
    return false;
  }

  /** Whether `el` is still under the root and not released: a binding for an element that has left it is not made. */
  const current = (el: Element): boolean => live && root.contains(el) && !suspendedAt(el);

  /**
   * Run `task` with a module's functions: now when the module has evaluated, else once the scanner has loaded it. A
   * failed load is reported in development only, and the elements it was for stay as they are.
   */
  function whenLoaded<A>(loaded: () => A | undefined, load: () => Promise<void>, task: (api: A) => void, what: string): void {
    const api = loaded();
    if (api) {
      task(api);
      return;
    }
    load()
      .then(() => {
        const later = loaded();
        if (later && live) task(later);
      })
      .catch((error: unknown) => {
        if (development) console.error(`[@udixio/motion] The ${what} module failed to load:`, error);
      });
  }
  const whenValues = (task: (api: ValueApi) => void) => whenLoaded(valuesModule, loadValues, task, 'values');
  const whenSequences = (task: (api: SequenceApi) => void) => whenLoaded(sequencesModule, loadSequences, task, 'sequences');
  const whenGestures = (task: (api: GestureApi) => void) => whenLoaded(gesturesModule, loadGestures, task, 'gestures');

  /** Bind the names of `el`, in order. A motion wins over a sequence of the same name; an undefined name waits alone. */
  function bind(el: MotionElement, entering: boolean): void {
    undefer(el);
    for (const name of namesOf(el)) {
      const ref = resolveMotion(name);
      if (ref) {
        bindRef(el, ref, entering);
        continue;
      }
      if (resolveSequence(name)) bindSequenceName(el, name, entering);
      else defer(el, name);
    }
    bindValues(el);
    bindGesture(el);
  }

  /**
   * Bind the sequence `name` on `el` once the sequences module is loaded, at once when it is. A motion of that name that
   * is defined by then wins, as it does at bind; an element that no longer carries the name binds nothing.
   */
  function bindSequenceName(el: MotionElement, name: string, entering: boolean): void {
    // A sequence plays on the steps of an HTML element: an SVG element is left alone.
    if (!isHtmlElement(el)) return;
    whenSequences(api => {
      if (!current(el) || !namesOf(el).includes(name)) return;
      const ref = resolveMotion(name);
      if (ref) bindRef(el, ref, entering);
      else bindSequence(api, el, name, entering);
    });
  }

  /** Bind the sequence `name` on `el`, unless the scanner already holds a sequence there that is still the registered one. */
  function bindSequence(api: SequenceApi, el: HTMLElement, name: string, entering: boolean): void {
    const ref = resolveSequence(name);
    if (!ref) return;
    const owned = boundSequences.get(el);
    if (owned && api.getSequence(el) === owned) return;
    boundSequences.set(el, api.sequence(el, ref, { settled: !entering, development }));
  }

  /** Bind the value names of `el`, in order, once the values module is loaded; an element with no value name loads nothing. */
  function bindValues(el: MotionElement): void {
    if (!isHtmlElement(el)) return;
    if (valueNamesOf(el).length === 0) {
      undeferValues(el);
      return;
    }
    whenValues(api => {
      if (current(el)) bindValueNames(api, el);
    });
  }

  /** Bind the value names of `el`, in order. An undefined name waits alone until it is defined. */
  function bindValueNames(api: ValueApi, el: HTMLElement): void {
    undeferValues(el);
    for (const name of valueNamesOf(el)) {
      if (resolveValue(name)) bindValue(api, el, name);
      else deferValue(el, name);
    }
  }

  /** Bind the value `name` on `el`, unless the scanner already holds it there and it is still the registered one. */
  function bindValue(api: ValueApi, el: HTMLElement, name: string): void {
    const owned = boundValues.get(el)?.get(name);
    if (owned && api.getValue(el, name) === owned) return;
    const binding = api.value(el, name, { development });
    let map = boundValues.get(el);
    if (!map) boundValues.set(el, (map = new Map()));
    map.set(name, binding);
  }

  /** An undefined value name leaves that name untouched until its value is defined. */
  function deferValue(el: MotionElement, name: string): void {
    const waiting = pendingValues.get(name) ?? new Set<MotionElement>();
    pendingValues.set(name, waiting.add(el));
    if (!development || reportedValues.has(name)) return;
    reportedValues.add(name);
    console.error(`[@udixio/motion] Unknown value "${name}": it is bound once defineValue defines it.`);
  }

  function undeferValues(el: MotionElement): void {
    for (const [name, waiting] of pendingValues) {
      waiting.delete(el);
      if (waiting.size === 0) pendingValues.delete(name);
    }
  }

  /** Destroy the values the scanner bound on `el`, the ones still registered, and forget the rest. */
  function forgetValues(el: MotionElement): void {
    const api = valuesModule();
    if (isHtmlElement(el)) {
      boundValues.get(el)?.forEach((binding, name) => {
        if (api?.getValue(el, name) === binding) binding.destroy();
      });
    }
    boundValues.delete(el);
    undeferValues(el);
  }

  /**
   * Bind the gesture `data-motion-gesture` names on `el`, once the gestures module is loaded: at once when it is. An
   * element with no gesture name binds nothing, and an undefined name waits until it is defined.
   */
  function bindGesture(el: MotionElement): void {
    const name = gestureNameOf(el);
    if (!name || !isHtmlElement(el)) return;
    whenGestures(api => {
      if (!current(el) || gestureNameOf(el) !== name) return;
      if (resolveGesture(name)) bindGestureName(api, el, name);
      else deferGesture(el, name);
    });
  }

  /** Bind the gesture `name` on `el`. The element carries one gesture at a time, so this replaces the one there. */
  function bindGestureName(api: GestureApi, el: HTMLElement, name: string): void {
    undeferGesture(el);
    boundGestures.set(el, api.gesture(el, name, { development }));
  }

  /** An undefined gesture name leaves the element untouched until defineGesture defines it. */
  function deferGesture(el: MotionElement, name: string): void {
    const waiting = pendingGestures.get(name) ?? new Set<MotionElement>();
    pendingGestures.set(name, waiting.add(el));
    if (!development || reportedGestures.has(name)) return;
    reportedGestures.add(name);
    console.error(`[@udixio/motion] Unknown gesture "${name}": it is bound once defineGesture defines it.`);
  }

  function undeferGesture(el: MotionElement): void {
    for (const [name, waiting] of pendingGestures) {
      waiting.delete(el);
      if (waiting.size === 0) pendingGestures.delete(name);
    }
  }

  /** Destroy the gesture the scanner bound on `el`, while it is still the registered one, and forget the rest. */
  function forgetGesture(el: MotionElement): void {
    const binding = boundGestures.get(el);
    if (binding && isHtmlElement(el) && gesturesModule()?.getGesture(el) === binding) binding.destroy();
    boundGestures.delete(el);
    undeferGesture(el);
  }

  /** Bind the motion `ref` on `el`, unless the scanner has already bound a motion of its kind there. */
  function bindRef(el: MotionElement, ref: MotionRef, entering: boolean): void {
    const kind = kindOf(ref.spec.verb);
    if (kind === 'layout' && !isHtmlElement(el)) {
      if (development && !refusedLayouts.has(el)) {
        refusedLayouts.add(el);
        console.error(`[@udixio/motion] "${ref.name}" ignored on an SVG element: a layout motion applies to an HTML element.`);
      }
      return;
    }
    const owned = bound.get(el)?.get(kind);
    if (owned && getMotion(el, kind) === owned.binding) {
      if (development && !conflicts.has(el)) {
        conflicts.add(el);
        console.error(`[@udixio/motion] "${ref.name}" ignored on an element that already has a ${kind} motion ("${owned.name}").`);
      }
      return;
    }
    const binding = motion(el, ref, {
      present: !el.hasAttribute('hidden'),
      settled: !entering,
      development,
      shared: sharedOf(el, development),
      restoreFocus: restoreFocusOf(el, development),
    });
    let kinds = bound.get(el);
    if (!kinds) bound.set(el, (kinds = new Map()));
    kinds.set(kind, { name: ref.name, binding });
    // A loop bound while the author holds it starts paused, and stays paused until the attribute is removed.
    if (kind === 'loop' && el.hasAttribute('data-motion-paused')) binding.pause();
  }

  /** A change of `data-motion-shared` re-binds the layout motion the scanner bound on `el`, under the same name and the new key. */
  function reshare(el: MotionElement): void {
    const owned = bound.get(el)?.get('layout');
    if (!owned || ownBinding(el, 'layout') !== owned.binding) return;
    const ref = resolveMotion(owned.name);
    if (!ref) return;
    owned.binding.destroy();
    bindRef(el, ref, false);
  }

  /** The binding of `kind` that the scanner bound on `el`, while it is still the registered one. */
  function ownBinding(el: MotionElement, kind: MotionKind): MotionBinding | undefined {
    const owned = bound.get(el)?.get(kind);
    return owned && getMotion(el, kind) === owned.binding ? owned.binding : undefined;
  }

  /** An undefined name leaves that name untouched until its motion is defined. */
  function defer(el: MotionElement, name: string): void {
    const waiting = pending.get(name) ?? new Set<MotionElement>();
    pending.set(name, waiting.add(el));
    if (!development || reported.has(name)) return;
    reported.add(name);
    console.error(`[@udixio/motion] Unknown motion "${name}". Defined: ${definedMotions().join(', ')}`);
  }

  function undefer(el: MotionElement): void {
    for (const [name, waiting] of pending) {
      waiting.delete(el);
      if (waiting.size === 0) pending.delete(name);
    }
  }

  /**
   * Destroy the bindings the scanner made on an element that left the root, and release what it holds on it.
   * A binding made by hand on the element is not the scanner's, even when it replaced one of the scanner's.
   */
  function forget(el: MotionElement): void {
    releaseHiddenHold(el);
    for (const kind of bound.get(el)?.keys() ?? []) ownBinding(el, kind)?.destroy();
    bound.delete(el);
    const sequenceBinding = boundSequences.get(el);
    if (sequenceBinding && isHtmlElement(el) && sequencesModule()?.getSequence(el) === sequenceBinding) sequenceBinding.destroy();
    boundSequences.delete(el);
    undefer(el);
    forgetValues(el);
    forgetGesture(el);
  }

  /**
   * Make the presence of an element with a presence motion follow its `hidden` attribute. `hidden` stays the author's
   * attribute: during an exit the element is kept displayed by its natural display, held inline, until the exit ends.
   */
  function syncPresence(el: MotionElement): void {
    const binding = ownBinding(el, 'presence');
    if (!binding) return;
    const wanted = !el.hasAttribute('hidden');
    if (wanted !== binding.present) void setPresentByHidden(el, wanted, [binding]);
  }

  /**
   * A `data-state` change replays the emphasis and the reveal of `el`, as a deferred play() does; a presence, a loop
   * and a scrub are left alone.
   */
  function replayState(el: MotionElement): void {
    for (const kind of ['emphasis', 'view'] as const) {
      const binding = ownBinding(el, kind);
      if (binding && replayable(binding)) binding.play();
    }
  }

  function observe(records: MutationRecord[]): void {
    for (const record of records) {
      if (record.type === 'childList') {
        // A node moved within the root keeps its binding: it is still under root when its removal is read.
        for (const el of Array.from(record.removedNodes).flatMap(scannedElements)) if (!root.contains(el)) forget(el);
        for (const el of Array.from(record.addedNodes).flatMap(scannedElements)) {
          if (current(el) && !bound.has(el) && !boundValues.has(el) && !boundSequences.has(el) && !boundGestures.has(el)) bind(el, true);
        }
        continue;
      }
      const el = record.target;
      if (!(el instanceof Element) || !motionable(el) || !current(el)) continue;
      if (record.attributeName === 'data-motion') {
        forget(el);
        bind(el, false);
      } else if (record.attributeName === 'data-motion-value') {
        forgetValues(el);
        bindValues(el);
      } else if (record.attributeName === 'data-motion-gesture') {
        forgetGesture(el);
        bindGesture(el);
      } else if (record.attributeName === 'data-state') {
        replayState(el);
      } else if (record.attributeName === 'data-motion-shared') {
        reshare(el);
      } else if (record.attributeName === 'data-motion-paused') {
        const loop = ownBinding(el, 'loop');
        if (el.hasAttribute('data-motion-paused')) loop?.pause();
        else loop?.play();
      } else {
        syncPresence(el);
      }
    }
  }

  for (const el of scannedElements(root)) bind(el, false);
  const observer = new MutationObserver(observe);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-motion', 'data-motion-shared', 'data-motion-paused', 'data-motion-value', 'data-motion-gesture', 'data-state', 'hidden'],
  });
  const unsubscribe = onMotionDefined(ref => {
    const waiting = pending.get(ref.name);
    if (!waiting) return;
    pending.delete(ref.name);
    // Only the defined name is bound: the other names of the element keep their bindings.
    for (const el of waiting) if (current(el) && namesOf(el).includes(ref.name)) bindRef(el, ref, false);
  });
  const unsubscribeSequences = onSequenceDefined(ref => {
    const waiting = pending.get(ref.name);
    if (!waiting) return;
    pending.delete(ref.name);
    // A sequence bound once its name is defined is settled: it does not play on the page it was waiting for.
    whenSequences(api => {
      for (const el of waiting) if (current(el) && isHtmlElement(el) && namesOf(el).includes(ref.name)) bindSequence(api, el, ref.name, false);
    });
  });
  const unsubscribeValues = onValueDefined(ref => {
    const waiting = pendingValues.get(ref.name);
    if (!waiting) return;
    pendingValues.delete(ref.name);
    whenValues(api => {
      for (const el of waiting) if (current(el) && isHtmlElement(el) && valueNamesOf(el).includes(ref.name)) bindValue(api, el, ref.name);
    });
  });
  const unsubscribeGestures = onGestureDefined(ref => {
    const waiting = pendingGestures.get(ref.name);
    if (!waiting) return;
    pendingGestures.delete(ref.name);
    whenGestures(api => {
      for (const el of waiting) if (current(el) && isHtmlElement(el) && gestureNameOf(el) === ref.name) bindGestureName(api, el, ref.name);
    });
  });

  const scanner = {
    root,
    suspend(scope: Element) {
      suspended.add(scope);
    },
    disconnect() {
      scanners.delete(scanner);
      live = false;
      observer.disconnect();
      unsubscribe();
      unsubscribeSequences();
      unsubscribeValues();
      unsubscribeGestures();
      for (const el of new Set([...bound.keys(), ...boundSequences.keys(), ...boundValues.keys(), ...boundGestures.keys()])) forget(el);
      pending.clear();
      pendingValues.clear();
      pendingGestures.clear();
    },
  };
  scanners.add(scanner);
  return scanner.disconnect;
}
