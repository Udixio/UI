import { getMotion, motion, type MotionBinding } from './bind.js';
import { definedMotions, onMotionDefined, resolveMotion, type MotionSpec } from './define-motion.js';

export interface ConnectOptions {
  root?: Document | Element;
  development?: boolean;
}

type Verb = MotionSpec['verb'];
/** The inline display held during an exit, with the author's inline value it replaces. */
type Hold = { value: string; priority: string };

/** The elements under `node`, the node itself included, that carry `data-motion`. */
function motionElements(node: Node): HTMLElement[] {
  const within = node instanceof Element || node instanceof Document ? [...node.querySelectorAll<HTMLElement>('[data-motion]')] : [];
  return node instanceof HTMLElement && node.hasAttribute('data-motion') ? [node, ...within] : within;
}

/**
 * Bind the `[data-motion]` elements under `root` and keep the bindings in step with the DOM:
 * an insertion plays its entry, a removal destroys, and `data-motion`, `data-state` and `hidden`
 * drive the motion. The returned function disconnects the scanner and destroys its bindings.
 */
export function connectMotion(options: ConnectOptions = {}): () => void {
  const root = options.root ?? document;
  const development = options.development ?? false;
  const bound = new Set<HTMLElement>();
  const pending = new Map<string, Set<HTMLElement>>();
  const holds = new Map<HTMLElement, Hold>();
  const reported = new Set<string>();

  function bind(el: HTMLElement, entering: boolean): void {
    const name = el.getAttribute('data-motion');
    if (!name) return;
    const ref = resolveMotion(name);
    if (!ref) {
      defer(el, name);
      return;
    }
    undefer(el);
    bound.add(el);
    motion(el, ref, { present: !el.hasAttribute('hidden'), settled: !entering, development });
  }

  /** The verb of the motion this scanner bound on `el`; a binding made by hand on it is not the scanner's. */
  function boundVerb(el: HTMLElement): Verb | undefined {
    return bound.has(el) ? getMotion(el)?.verb : undefined;
  }

  /** An undefined name leaves the element untouched until that motion is defined. */
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

  /** Destroy the binding of an element that left the root, and release what the scanner holds on it. */
  function forget(el: HTMLElement): void {
    release(el);
    if (bound.delete(el)) getMotion(el)?.destroy();
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
      if (result === 'finished' && holds.get(el) === hold) release(el);
    });
  }

  /** Make the presence of a presence element follow its `hidden` attribute. */
  function syncPresence(el: HTMLElement): void {
    const binding = getMotion(el);
    const verb = boundVerb(el);
    if (!binding || (verb !== 'appear' && verb !== 'disappear')) return;
    const wanted = !el.hasAttribute('hidden');
    if (wanted === binding.present) return;
    if (wanted) {
      release(el);
      void binding.setPresent(true);
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
        if (boundVerb(el) === 'emphasize') getMotion(el)?.play();
      } else {
        syncPresence(el);
      }
    }
  }

  for (const el of motionElements(root)) bind(el, false);
  const observer = new MutationObserver(observe);
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-motion', 'data-state', 'hidden'] });
  const unsubscribe = onMotionDefined(ref => {
    const waiting = pending.get(ref.name);
    if (!waiting) return;
    pending.delete(ref.name);
    for (const el of waiting) if (root.contains(el) && el.getAttribute('data-motion') === ref.name) bind(el, false);
  });

  return () => {
    observer.disconnect();
    unsubscribe();
    for (const el of [...bound]) forget(el);
    pending.clear();
  };
}
