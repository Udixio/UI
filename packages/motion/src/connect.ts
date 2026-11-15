import { getMotion, motion, type MotionBinding } from './bind.js';
import { definedMotions, kindOf, onMotionDefined, resolveMotion, type MotionKind, type MotionRef } from './define-motion.js';
import { flushLayoutAround } from './layout-loader.js';

export interface ConnectOptions {
  root?: Document | Element;
  development?: boolean;
}

/** The inline display held during an exit, with the author's inline value it replaces. */
type Hold = { value: string; priority: string };
/** A motion the scanner bound on an element: the name it came from, and its binding. */
type Owned = { name: string; binding: MotionBinding };

/** The elements under `node`, the node itself included, that carry `data-motion`. */
function motionElements(node: Node): HTMLElement[] {
  const within = node instanceof Element || node instanceof Document ? [...node.querySelectorAll<HTMLElement>('[data-motion]')] : [];
  return node instanceof HTMLElement && node.hasAttribute('data-motion') ? [node, ...within] : within;
}

/** The names listed in the `data-motion` of an element, in order. */
function namesOf(el: HTMLElement): string[] {
  return (el.getAttribute('data-motion') ?? '').split(/\s+/).filter(Boolean);
}

/** The shared identity of an element: its `data-motion-shared`, when it is not empty. */
function sharedOf(el: HTMLElement): string | undefined {
  return el.getAttribute('data-motion-shared') || undefined;
}

/**
 * Bind the `[data-motion]` elements under `root` and keep the bindings in step with the DOM:
 * an insertion plays its entry, a removal destroys, and `data-motion`, `data-state` and `hidden`
 * drive the motion. An element may list several motions, one per kind. A `data-motion-shared`
 * gives the layout motion of the element a shared identity: it morphs from the place of another
 * element with the same key. The returned function disconnects the scanner and destroys its bindings.
 */
export function connectMotion(options: ConnectOptions = {}): () => void {
  const root = options.root ?? document;
  const development = options.development ?? false;
  /** The motions the scanner bound on each element, by kind. */
  const bound = new Map<HTMLElement, Map<MotionKind, Owned>>();
  const pending = new Map<string, Set<HTMLElement>>();
  const holds = new Map<HTMLElement, Hold>();
  const reported = new Set<string>();
  const conflicts = new WeakSet<HTMLElement>();

  /** Bind the names of `el`, in order. An undefined name waits alone; a motion of a kind already bound on `el` is ignored. */
  function bind(el: HTMLElement, entering: boolean): void {
    undefer(el);
    for (const name of namesOf(el)) {
      const ref = resolveMotion(name);
      if (ref) bindRef(el, ref, entering);
      else defer(el, name);
    }
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
    const binding = motion(el, ref, { present: !el.hasAttribute('hidden'), settled: !entering, development, shared: sharedOf(el) });
    let kinds = bound.get(el);
    if (!kinds) bound.set(el, (kinds = new Map()));
    kinds.set(kind, { name: ref.name, binding });
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
    undefer(el);
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
        for (const el of Array.from(record.removedNodes).flatMap(motionElements)) if (!root.contains(el)) forget(el);
        for (const el of Array.from(record.addedNodes).flatMap(motionElements)) if (root.contains(el) && !bound.has(el)) bind(el, true);
        continue;
      }
      const el = record.target;
      if (!(el instanceof HTMLElement) || !root.contains(el)) continue;
      if (record.attributeName === 'data-motion') {
        forget(el);
        bind(el, false);
      } else if (record.attributeName === 'data-state') {
        ownBinding(el, 'emphasis')?.play();
      } else if (record.attributeName === 'data-motion-shared') {
        reshare(el);
      } else {
        syncPresence(el);
      }
    }
  }

  for (const el of motionElements(root)) bind(el, false);
  const observer = new MutationObserver(observe);
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-motion', 'data-motion-shared', 'data-state', 'hidden'],
  });
  const unsubscribe = onMotionDefined(ref => {
    const waiting = pending.get(ref.name);
    if (!waiting) return;
    pending.delete(ref.name);
    // Only the defined name is bound: the other names of the element keep their bindings.
    for (const el of waiting) if (root.contains(el) && namesOf(el).includes(ref.name)) bindRef(el, ref, false);
  });

  return () => {
    observer.disconnect();
    unsubscribe();
    for (const el of [...bound.keys()]) forget(el);
    pending.clear();
  };
}
