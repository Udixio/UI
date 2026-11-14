import { createMotionPolicy, type MotionPolicy } from './runtime-policy.js';
import { createSharedRegistry } from './shared-registry.js';

// Preview revisions have distinct keys: incompatible revisions do not coordinate
// their schedulers. The stable v1 key is reserved for the complete contract.
const FRAME_RUNTIME_KEY = Symbol.for('udixio.motion.frame-runtime.preview.6');

/** Internal preview subset. */
export interface MotionRuntime {
  readonly version: string;
  readonly development: boolean;
  readonly policy: MotionPolicy;
  readonly shared: ReturnType<typeof createSharedRegistry>;
  retain(): void;
  release(): void;
  subscribe(name: string, sub: { tick(timestamp: number): void }, options?: { pauseWhenReduced?: boolean; root?: Element }): () => void;
  retryVisibility(): void;
  readonly frame: {
    read(callback: () => void): void;
    write(callback: () => void): void;
  };
}

function createRuntime(browser: boolean, development: boolean): MotionRuntime {
  const policy = browser ? createMotionPolicy() : {
    reduced: false, retain() {}, release() {}, subscribe() { return () => {}; },
  };
  const shared = browser && typeof document !== 'undefined'
    ? createSharedRegistry(document, development)
    : { register() { return () => {}; }, resolve() { return undefined; }, clear() {} };
  let references = 0;
  let frameId: number | undefined;
  let reads: Array<() => void> = [];
  let writes: Array<() => void> = [];
  let flushing = false;
  let generation = 0;
  let frameToken = 0;
  const subscribers = new Set<{ tick(timestamp: number): void; pauseWhenReduced: boolean; root?: Element }>();
  const roots = new Map<Element, { count: number; state: 'pending' | 'visible' | 'hidden' }>();
  const runtimeDocument = browser && typeof document !== 'undefined' ? document : undefined;
  let observer: IntersectionObserver | undefined;
  const retiredObservers = new Set<IntersectionObserver>();
  let observerToken = 0;
  let visibilityFailed = false;
  let documentHidden = false;
  let stopDocument: (() => void) | undefined;

  function eligible(sub: { pauseWhenReduced: boolean; root?: Element }) {
    return !documentHidden && (!sub.pauseWhenReduced || !policy.reduced) &&
      (!sub.root || roots.get(sub.root)?.state === 'visible');
  }

  function refreshSchedule() { cancelUnneededFrame(); schedule(); }

  function invalidateObserver() {
    observerToken++;
    const old = observer;
    observer = undefined;
    if (old) {
      retiredObservers.add(old);
      old.disconnect();
      retiredObservers.delete(old);
    }
  }

  function disconnectRetiredObservers() {
    for (const retired of retiredObservers) {
      retired.disconnect();
      retiredObservers.delete(retired);
    }
  }

  function rebuildVisibility() {
    const startGeneration = generation;
    const startToken = observerToken;
    for (const root of roots.values()) root.state = 'pending';
    refreshSchedule();
    if (generation !== startGeneration || observerToken !== startToken || !references) return;
    try { disconnectRetiredObservers(); }
    catch (error) { visibilityFailed = true; throw error; }
    if (generation !== startGeneration || observerToken !== startToken || !references) return;
    if (!roots.size) { visibilityFailed = false; return; }
    if (typeof IntersectionObserver === 'undefined') {
      for (const root of roots.values()) root.state = 'visible';
      visibilityFailed = false;
      refreshSchedule();
      return;
    }
    const token = ++observerToken;
    const currentGeneration = generation;
    try {
      const candidate = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (token !== observerToken || currentGeneration !== generation || !references) break;
          const root = roots.get(entry.target);
          if (!root) continue;
          root.state = entry.isIntersecting ? 'visible' : 'hidden';
          refreshSchedule();
        }
      }, { root: null, rootMargin: '0px', threshold: 0 });
      if (generation !== currentGeneration || observerToken !== token || !references) {
        candidate.disconnect();
        return;
      }
      observer = candidate;
      for (const root of roots.keys()) {
        candidate.observe(root);
        if (generation !== currentGeneration || observerToken !== token || !references) return;
      }
      visibilityFailed = false;
    } catch (error) {
      if (generation === currentGeneration && observerToken === token) {
        try { invalidateObserver(); } catch { /* preserve installation failure */ }
        if (generation === currentGeneration && observerToken === token + 1) {
          for (const root of roots.values()) root.state = 'pending';
          visibilityFailed = true;
          refreshSchedule();
        }
      }
      throw error;
    }
  }
  let stopPolicy: (() => void) | undefined;

  function hasWork() {
    return reads.length > 0 || writes.length > 0 ||
      [...subscribers].some(eligible);
  }

  function cancelUnneededFrame() {
    if (hasWork() || frameId === undefined) return;
    const pendingFrame = frameId;
    frameId = undefined;
    frameToken++;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(pendingFrame);
  }

  function schedule() {
    if (browser && references > 0 && hasWork() && !flushing && frameId === undefined && typeof requestAnimationFrame === 'function') {
      const scheduledGeneration = generation;
      const token = ++frameToken;
      frameId = requestAnimationFrame((timestamp) => {
        if (generation === scheduledGeneration && token === frameToken && references > 0) flush(timestamp);
      });
    }
  }

  function flush(timestamp: number) {
    frameId = undefined;
    flushing = true;
    const currentGeneration = generation;
    const run = (callbacks: Array<() => void>) => {
      for (const callback of callbacks) {
        if (generation !== currentGeneration) break;
        try {
          callback();
        } catch (error) {
          // Report without aborting other callbacks, as the browser does for rAF.
          try {
            if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
            else setTimeout(() => { throw error; }, 0);
          } catch (reportingError) {
            setTimeout(() => { throw error; }, 0);
            setTimeout(() => { throw reportingError; }, 0);
          }
        }
      }
    };
    const pendingSubscribers = [...subscribers];
    try {
      const pendingReads = reads;
      reads = [];
      run(pendingReads);
      if (generation === currentGeneration) {
        run(pendingSubscribers.map(sub => () => {
          if (subscribers.has(sub) && eligible(sub)) sub.tick(timestamp);
        }));
      }
      if (generation === currentGeneration) {
        const pendingWrites = writes;
        writes = [];
        run(pendingWrites);
      }
    } finally {
      flushing = false;
      schedule();
    }
  }

  return {
    version: '1',
    development,
    policy,
    shared,
    retain() {
      if (references === 0) {
        policy.retain();
        try {
          stopPolicy = policy.subscribe(refreshSchedule);
          if (runtimeDocument) {
            documentHidden = runtimeDocument.visibilityState === 'hidden';
            const documentGeneration = generation;
            const onVisibility = () => {
              if (documentGeneration !== generation || !references) return;
              documentHidden = runtimeDocument.visibilityState === 'hidden';
              refreshSchedule();
            };
            runtimeDocument.addEventListener?.('visibilitychange', onVisibility);
            stopDocument = () => runtimeDocument.removeEventListener?.('visibilitychange', onVisibility);
          }
        } catch (error) {
          try { stopDocument?.(); } catch { /* preserve activation failure */ }
          stopDocument = undefined;
          try { stopPolicy?.(); } catch { /* preserve activation failure */ }
          stopPolicy = undefined;
          try { policy.release(); } catch { /* preserve activation failure */ }
          throw error;
        }
      }
      references++;
    },
    release() {
      if (references === 0 || --references !== 0) return;
      generation++;
      frameToken++;
      reads = [];
      writes = [];
      subscribers.clear();
      roots.clear();
      visibilityFailed = false;
      const pendingFrame = frameId;
      frameId = undefined;
      const failures: unknown[] = [];
      try { invalidateObserver(); } catch (error) { failures.push(error); }
      try { disconnectRetiredObservers(); } catch (error) { failures.push(error); }
      try { stopDocument?.(); } catch (error) { failures.push(error); }
      stopDocument = undefined;
      try { shared.clear(); } catch (error) { failures.push(error); }
      try { stopPolicy?.(); } catch (error) { failures.push(error); }
      stopPolicy = undefined;
      try { policy.release(); } catch (error) { failures.push(error); }
      try {
        if (pendingFrame !== undefined && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(pendingFrame);
      } catch (error) { failures.push(error); }
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) throw new AggregateError(failures, 'Motion runtime cleanup failed');
    },
    retryVisibility() {
      if (!references || !visibilityFailed) return;
      rebuildVisibility();
    },
    subscribe(_name, sub, options) {
      if (references === 0) throw new Error('Motion runtime must be retained before subscribing');
      const subscriptionGeneration = generation;
      const root = options?.root;
      if (browser && root && root.ownerDocument !== runtimeDocument) throw new Error('Motion root must belong to the runtime document');
      const registration = { tick: (timestamp: number) => sub.tick(timestamp), pauseWhenReduced: options?.pauseWhenReduced === true, root };
      if (root && browser) {
        const existing = roots.get(root);
        if (existing) existing.count++;
        else {
          const rootEntry = { count: 1, state: 'pending' as const };
          roots.set(root, rootEntry);
          if (!visibilityFailed) {
            if (observer) {
              try { observer.observe(root); }
              catch (error) {
                if (generation !== subscriptionGeneration || roots.get(root) !== rootEntry) throw error;
                roots.delete(root);
                let rebuildError: unknown;
                const recoveryGeneration = generation;
                const recoveryToken = observerToken + 1;
                try {
                  invalidateObserver();
                  if (generation === recoveryGeneration && observerToken === recoveryToken) rebuildVisibility();
                } catch (failure) {
                  rebuildError = failure;
                  if (generation === recoveryGeneration && observerToken === recoveryToken) {
                    for (const remaining of roots.values()) remaining.state = 'pending';
                    visibilityFailed = roots.size > 0;
                    refreshSchedule();
                  }
                }
                if (rebuildError !== undefined) throw new AggregateError([error, rebuildError], 'Motion visibility installation and recovery failed');
                throw error;
              }
            } else {
              try { rebuildVisibility(); }
              catch (error) {
                if (generation === subscriptionGeneration && roots.get(root) === rootEntry) {
                  roots.delete(root);
                  if (!roots.size) visibilityFailed = false;
                }
                throw error;
              }
            }
          }
          if (generation !== subscriptionGeneration || roots.get(root) !== rootEntry) {
            throw new Error('Motion runtime changed during visibility subscription');
          }
        }
      }
      subscribers.add(registration);
      schedule();
      return () => {
        if (!subscribers.delete(registration)) return;
        if (root && browser) {
          const entry = roots.get(root);
          if (entry && --entry.count === 0) {
            roots.delete(root);
            if (!visibilityFailed) {
              const removalGeneration = generation;
              const removalToken = observerToken + 1;
              try { invalidateObserver(); }
              catch (error) {
                if (generation === removalGeneration && observerToken === removalToken) {
                  for (const remaining of roots.values()) remaining.state = 'pending';
                  visibilityFailed = roots.size > 0;
                  refreshSchedule();
                }
                throw error;
              }
              if (generation === removalGeneration && observerToken === removalToken) rebuildVisibility();
            } else if (!roots.size) visibilityFailed = false;
          }
        }
        refreshSchedule();
      };
    },
    frame: {
      read(callback) { if (browser && references > 0) { reads.push(callback); schedule(); } },
      write(callback) { if (browser && references > 0) { writes.push(callback); schedule(); } },
    },
  };
}

/** Each adapter supplies its development mode; copies must agree. SSR is isolated. */
export function getMotionRuntime(options: { development: boolean }): MotionRuntime {
  if (typeof window === 'undefined') return createRuntime(false, options.development);
  const host = globalThis as typeof globalThis & { [key: symbol]: MotionRuntime | undefined };
  const runtime = (host[FRAME_RUNTIME_KEY] ??= createRuntime(true, options.development));
  if (runtime.development !== options.development) {
    throw new Error('Motion runtime copies must agree on the development setting');
  }
  return runtime;
}

/** Acquire one owner-local lease; repeated cleanup cannot release another owner. */
export function retainMotionRuntime(runtime: MotionRuntime): () => void {
  runtime.retain();
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    runtime.release();
  };
}
