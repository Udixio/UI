import { getMotion, motion, type MotionBinding } from './bind.js';
import { definedMotions, kindOf, onMotionDefined, resolveMotion, type MotionKind, type MotionRef } from './define-motion.js';
import { flushLayoutAround } from './layout-loader.js';
import { NAME_PATTERN } from './manifest.js';
import { getSequence, onSequenceDefined, resolveSequence, sequence, type SequenceBinding, type SequenceRef } from './sequence.js';
import { onValueDefined, resolveValue } from './value.js';
import { getValue, value, type ValueBinding } from './value-binding.js';

export interface ConnectOptions {
  root?: Document | Element;
  development?: boolean;
}

/** The inline display held during an exit, with the author's inline value it replaces. */
type Hold = { value: string; priority: string };
/** A motion the scanner bound on an element: the name it came from, and its binding. */
type Owned = { name: string; binding: MotionBinding };

/** The elements under `node`, the node itself included, that carry `data-motion` or `data-motion-value`. */
function scannedElements(node: Node): HTMLElement[] {
  const selector = '[data-motion], [data-motion-value]';
  const within = node instanceof Element || node instanceof Document ? [...node.querySelectorAll<HTMLElement>(selector)] : [];
  return node instanceof HTMLElement && node.matches(selector) ? [node, ...within] : within;
}

/** The names listed in the `data-motion` of an element, in order. */
function namesOf(el: HTMLElement): string[] {
  return (el.getAttribute('data-motion') ?? '').split(/\s+/).filter(Boolean);
}

/** The names listed in the `data-motion-value` of an element, in order. */
function valueNamesOf(el: HTMLElement): string[] {
  return (el.getAttribute('data-motion-value') ?? '').split(/\s+/).filter(Boolean);
}

/**
 * The shared identity of an element: its `data-motion-shared`, when it is a kebab-case key. An empty value is no
 * key; an invalid one is reported (in development) and ignored, so that one bad attribute never stops the scan.
 */
function sharedOf(el: HTMLElement, development: boolean): string | undefined {
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
 * on the element; its `data-motion-step` children need no scanning of their own. The returned function disconnects the
 * scanner and destroys its bindings.
 */
export function connectMotion(options: ConnectOptions = {}): () => void {
  const root = options.root ?? document;
  const development = options.development ?? false;
  /** The motions the scanner bound on each element, by kind. */
  const bound = new Map<HTMLElement, Map<MotionKind, Owned>>();
  /** The sequences the scanner bound on each element. */
  const boundSequences = new Map<HTMLElement, SequenceBinding>();
  const pending = new Map<string, Set<HTMLElement>>();
  /** The values the scanner bound on each element, by name; and the elements waiting for each undefined name. */
  const boundValues = new Map<HTMLElement, Map<string, ValueBinding>>();
  const pendingValues = new Map<string, Set<HTMLElement>>();
  const holds = new Map<HTMLElement, Hold>();
  const reported = new Set<string>();
  const reportedValues = new Set<string>();
  const conflicts = new WeakSet<HTMLElement>();

  /** Bind the names of `el`, in order. A motion wins over a sequence of the same name; an undefined name waits alone. */
  function bind(el: HTMLElement, entering: boolean): void {
    undefer(el);
    for (const name of namesOf(el)) {
      const ref = resolveMotion(name);
      if (ref) {
        bindRef(el, ref, entering);
        continue;
      }
      const sequenceRef = resolveSequence(name);
      if (sequenceRef) bindSequence(el, sequenceRef, entering);
      else defer(el, name);
    }
    bindValues(el);
  }

  /** Bind the sequence `ref` on `el`, unless the scanner already holds a sequence there that is still the registered one. */
  function bindSequence(el: HTMLElement, ref: SequenceRef, entering: boolean): void {
    const owned = boundSequences.get(el);
    if (owned && getSequence(el) === owned) return;
    boundSequences.set(el, sequence(el, ref, { settled: !entering, development }));
  }

  /** Bind the value names of `el`, in order. An undefined name waits alone until it is defined. */
  function bindValues(el: HTMLElement): void {
    undeferValues(el);
    for (const name of valueNamesOf(el)) {
      if (resolveValue(name)) bindValue(el, name);
      else deferValue(el, name);
    }
  }

  /** Bind the value `name` on `el`, unless the scanner already holds it there and it is still the registered one. */
  function bindValue(el: HTMLElement, name: string): void {
    const owned = boundValues.get(el)?.get(name);
    if (owned && getValue(el, name) === owned) return;
    const binding = value(el, name, { development });
    let map = boundValues.get(el);
    if (!map) boundValues.set(el, (map = new Map()));
    map.set(name, binding);
  }

  /** An undefined value name leaves that name untouched until its value is defined. */
  function deferValue(el: HTMLElement, name: string): void {
    const waiting = pendingValues.get(name) ?? new Set<HTMLElement>();
    pendingValues.set(name, waiting.add(el));
    if (!development || reportedValues.has(name)) return;
    reportedValues.add(name);
    console.error(`[@udixio/motion] Unknown value "${name}": it is bound once defineValue defines it.`);
  }

  function undeferValues(el: HTMLElement): void {
    for (const [name, waiting] of pendingValues) {
      waiting.delete(el);
      if (waiting.size === 0) pendingValues.delete(name);
    }
  }

  /** Destroy the values the scanner bound on `el`, the ones still registered, and forget the rest. */
  function forgetValues(el: HTMLElement): void {
    boundValues.get(el)?.forEach((binding, name) => {
      if (getValue(el, name) === binding) binding.destroy();
    });
    boundValues.delete(el);
    undeferValues(el);
  }

  /** Bind the motion `ref` on `el`, unless the scanner has already bound a motion of its kind there. */
  function bindRef(el: HTMLElement, ref: MotionRef, entering: boolean): void {
    const kind = kindOf(ref.spec.verb);
    const owned = bound.get(el)?.get(kind);
    if (owned && getMotion(el, kind) === owned.binding) {
      if (development && !conflicts.has(el)) {
        conflicts.add(el);
        console.error(`[@udixio/motion] "${ref.name}" ignored on an element that already has a ${kind} motion ("${owned.name}").`);
      }
      return;
    }
    const binding = motion(el, ref, { present: !el.hasAttribute('hidden'), settled: !entering, development, shared: sharedOf(el, development) });
    let kinds = bound.get(el);
    if (!kinds) bound.set(el, (kinds = new Map()));
    kinds.set(kind, { name: ref.name, binding });
    // A loop bound while the author holds it starts paused, and stays paused until the attribute is removed.
    if (kind === 'loop' && el.hasAttribute('data-motion-paused')) binding.pause();
  }

  /** A change of `data-motion-shared` re-binds the layout motion the scanner bound on `el`, under the same name and the new key. */
  function reshare(el: HTMLElement): void {
    const owned = bound.get(el)?.get('layout');
    if (!owned || ownBinding(el, 'layout') !== owned.binding) return;
    const ref = resolveMotion(owned.name);
    if (!ref) return;
    owned.binding.destroy();
    bindRef(el, ref, false);
  }

  /** The binding of `kind` that the scanner bound on `el`, while it is still the registered one. */
  function ownBinding(el: HTMLElement, kind: MotionKind): MotionBinding | undefined {
    const owned = bound.get(el)?.get(kind);
    return owned && getMotion(el, kind) === owned.binding ? owned.binding : undefined;
  }

  /** An undefined name leaves that name untouched until its motion is defined. */
  function defer(el: HTMLElement, name: string): void {
    const waiting = pending.get(name) ?? new Set<HTMLElement>();
    pending.set(name, waiting.add(el));
    if (!development || reported.has(name)) return;
    reported.add(name);
    console.error(`[@udixio/motion] Unknown motion "${name}". Defined: ${definedMotions().join(', ')}`);
  }

  function undefer(el: HTMLElement): void {
    for (const [name, waiting] of pending) {
      waiting.delete(el);
      if (waiting.size === 0) pending.delete(name);
    }
  }

  /** Give back the inline display held for an exit, if any. */
  function release(el: HTMLElement): void {
    const hold = holds.get(el);
    if (!hold) return;
    holds.delete(el);
    if (hold.value) el.style.setProperty('display', hold.value, hold.priority);
    else el.style.removeProperty('display');
  }

  /**
   * Destroy the bindings the scanner made on an element that left the root, and release what it holds on it.
   * A binding made by hand on the element is not the scanner's, even when it replaced one of the scanner's.
   */
  function forget(el: HTMLElement): void {
    release(el);
    for (const kind of bound.get(el)?.keys() ?? []) ownBinding(el, kind)?.destroy();
    bound.delete(el);
    const sequenceBinding = boundSequences.get(el);
    if (sequenceBinding && getSequence(el) === sequenceBinding) sequenceBinding.destroy();
    boundSequences.delete(el);
    undefer(el);
    forgetValues(el);
  }

  /**
   * Start an exit. `hidden` stays the author's attribute: the element is kept displayed by its
   * natural display, held inline, until the exit ends.
   */
  function hide(el: HTMLElement, binding: MotionBinding): void {
    release(el);
    const attribute = el.getAttribute('hidden') ?? '';
    el.removeAttribute('hidden');
    const natural = getComputedStyle(el).display;
    el.setAttribute('hidden', attribute);
    const hold: Hold = { value: el.style.getPropertyValue('display'), priority: el.style.getPropertyPriority('display') };
    holds.set(el, hold);
    el.style.setProperty('display', natural, 'important');
    void binding.setPresent(false).then(result => {
      if (result !== 'finished' || holds.get(el) !== hold) return;
      release(el);
      // The element is display: none from now on. The style change is not seen by the layout observer, so it is announced.
      flushLayoutAround(el);
    });
  }

  /** Make the presence of an element with a presence motion follow its `hidden` attribute. */
  function syncPresence(el: HTMLElement): void {
    const binding = ownBinding(el, 'presence');
    if (!binding) return;
    const wanted = !el.hasAttribute('hidden');
    if (wanted === binding.present) return;
    if (wanted) {
      release(el);
      void binding.setPresent(true);
      // An element shown again after a finished exit was display: none, out of the flow: its neighbours make room.
      flushLayoutAround(el);
    } else {
      hide(el, binding);
    }
  }

  function observe(records: MutationRecord[]): void {
    for (const record of records) {
      if (record.type === 'childList') {
        // A node moved within the root keeps its binding: it is still under root when its removal is read.
        for (const el of Array.from(record.removedNodes).flatMap(scannedElements)) if (!root.contains(el)) forget(el);
        for (const el of Array.from(record.addedNodes).flatMap(scannedElements)) if (root.contains(el) && !bound.has(el) && !boundValues.has(el) && !boundSequences.has(el)) bind(el, true);
        continue;
      }
      const el = record.target;
      if (!(el instanceof HTMLElement) || !root.contains(el)) continue;
      if (record.attributeName === 'data-motion') {
        forget(el);
        bind(el, false);
      } else if (record.attributeName === 'data-motion-value') {
        forgetValues(el);
        bindValues(el);
      } else if (record.attributeName === 'data-state') {
        ownBinding(el, 'emphasis')?.play();
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
    attributeFilter: ['data-motion', 'data-motion-shared', 'data-motion-paused', 'data-motion-value', 'data-state', 'hidden'],
  });
  const unsubscribe = onMotionDefined(ref => {
    const waiting = pending.get(ref.name);
    if (!waiting) return;
    pending.delete(ref.name);
    // Only the defined name is bound: the other names of the element keep their bindings.
    for (const el of waiting) if (root.contains(el) && namesOf(el).includes(ref.name)) bindRef(el, ref, false);
  });
  const unsubscribeSequences = onSequenceDefined(ref => {
    const waiting = pending.get(ref.name);
    if (!waiting) return;
    pending.delete(ref.name);
    // A sequence bound once its name is defined is settled: it does not play on the page it was waiting for.
    for (const el of waiting) if (root.contains(el) && namesOf(el).includes(ref.name)) bindSequence(el, ref, false);
  });
  const unsubscribeValues = onValueDefined(ref => {
    const waiting = pendingValues.get(ref.name);
    if (!waiting) return;
    pendingValues.delete(ref.name);
    for (const el of waiting) if (root.contains(el) && valueNamesOf(el).includes(ref.name)) bindValue(el, ref.name);
  });

  return () => {
    observer.disconnect();
    unsubscribe();
    unsubscribeSequences();
    unsubscribeValues();
    for (const el of new Set([...bound.keys(), ...boundSequences.keys(), ...boundValues.keys()])) forget(el);
    pending.clear();
    pendingValues.clear();
  };
}
