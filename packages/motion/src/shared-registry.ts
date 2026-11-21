import type { MotionRuntime } from './runtime.js';

/**
 * How long, in ms, the box of a holder serves as the place a shared identity arrives from, counted from the moment the
 * engine learns that the holder is gone.
 */
export const SHARED_WINDOW = 600;

/** Delay before a forgotten holder's memory is deleted: the window, with a margin so that a recall at its edge still finds it. */
const EXPIRY = SHARED_WINDOW + 50;

/** A box in page coordinates: the viewport rect plus the scroll offsets of its window. */
export interface PageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where a departed holder is now, followed through the element it sat in: its box in page coordinates, or undefined
 * while that element is not displayed. A page scroll moves the box with that element, as the holder moved with it.
 */
export type Follow = () => PageBox | undefined;

/**
 * The last holder of a shared key: its box when it was last seen, how to follow it once it went away (undefined while
 * it is still the holder), and the timer that deletes it.
 */
interface Memory {
  element: Element;
  box: PageBox;
  follow: Follow | undefined;
  goneAt: number | undefined;
  timer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * The page-wide registry of shared identities, one instance per document: the live elements registered under a key,
 * and the last box of the element that held each key, with the time it went away. A holder hidden through an inline
 * style is never forgotten (the engine does not observe style changes): its box then serves until the next holder
 * arrives, and the window counts from the moment the engine learns that the holder is gone.
 */
export function createSharedRegistry(document: Document, development: boolean) {
  const entries = new Map<string, Array<{ element: Element | undefined }>>();
  const memories = new Map<string, Memory>();
  const announced = new Set<string>();

  function isLive(element: Element): boolean {
    return element.ownerDocument === document && element.isConnected &&
      element.getAttribute('data-motion-presence') !== 'exiting';
  }

  /** Whether a remembered holder still holds its key: it is live and displayed (an element with `display: none` is not). */
  function isHolder(element: Element): boolean {
    return isLive(element) && element.getClientRects().length > 0;
  }

  function duplicate(key: string): never {
    throw new Error(`Multiple live shared elements registered for "${key}"`);
  }

  return {
    register(key: string, element: Element): () => void {
      if (element.ownerDocument !== document) {
        throw new Error('Shared element belongs to a different document');
      }
      const current = entries.get(key);
      if (development && isLive(element) && current?.some(entry => entry.element && entry.element !== element && isLive(entry.element))) {
        duplicate(key);
      }
      const entry: { element: Element | undefined } = { element };
      if (current) current.push(entry);
      else entries.set(key, [entry]);
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        entry.element = undefined;
        const list = entries.get(key);
        if (!list) return;
        const index = list.indexOf(entry);
        if (index !== -1) list.splice(index, 1);
        if (!list.length) entries.delete(key);
      };
    },
    resolve(key: string): Element | undefined {
      let first: Element | undefined;
      for (const { element } of entries.get(key) ?? []) {
        if (!element || !isLive(element)) continue;
        if (!first) first = element;
        else if (development && first !== element) duplicate(key);
        if (!development) break;
      }
      return first;
    },
    /**
     * `element` now holds `key`, seen at `box`, and `follow` tells where it is once it has gone: it replaces the memory of
     * the previous holder, whose pending deletion is cancelled.
     */
    remember(key: string, element: Element, box: PageBox, follow?: Follow): void {
      const previous = memories.get(key);
      if (previous?.timer !== undefined) clearTimeout(previous.timer);
      memories.set(key, { element, box, follow, goneAt: undefined, timer: undefined });
    },
    /** The holder of `key` is gone (destroyed, hidden): its box stays valid for a window, then its memory is deleted. */
    forget(key: string, element: Element): void {
      const memory = memories.get(key);
      if (memory?.element !== element || memory.goneAt !== undefined) return;
      memory.goneAt = performance.now();
      const timer = setTimeout(() => {
        if (memories.get(key) === memory && !isHolder(element)) memories.delete(key);
      }, EXPIRY);
      // A pending deletion never keeps a Node process alive (unit tests); browsers return a number, which has no unref.
      (timer as { unref?: () => void }).unref?.();
      memory.timer = timer;
    },
    /**
     * Where `key` was last seen on another element that is no longer a holder, if that was at most `maxAge` ms ago: where
     * it is now when it can be followed, else where it was. A live holder other than `element` is reported in development,
     * once per key, and blocks the recall.
     */
    recall(key: string, element: Element, maxAge = SHARED_WINDOW): PageBox | undefined {
      const memory = memories.get(key);
      if (!memory || memory.element === element) return undefined;
      if (isHolder(memory.element)) {
        if (development && !announced.has(key)) {
          announced.add(key);
          console.error(`[@udixio/motion] Two live elements share "${key}": the second one does not morph.`);
        }
        return undefined;
      }
      const now = performance.now();
      // A holder that left without being forgotten is taken to have left just now.
      const goneAt = memory.goneAt ?? now;
      return now - goneAt <= maxAge ? (memory.follow?.() ?? memory.box) : undefined;
    },
    /** Empties the registrations only: the memories expire on their own, a window after their holder went away. */
    clear(): void {
      for (const list of entries.values()) {
        for (const entry of list) entry.element = undefined;
      }
      entries.clear();
    },
  };
}

/** The registry of a page's runtime. */
export type SharedRegistry = ReturnType<typeof createSharedRegistry>;

/**
 * The page's registry of shared identities, created the first time the layout engine needs it: a page without a shared
 * element never holds one. It is kept on the runtime, which every copy of the package shares.
 */
export function sharedOf(runtime: MotionRuntime): SharedRegistry {
  return (runtime.shared ??= createSharedRegistry(document, runtime.development));
}
