/** Internal policy store; it is not yet connected to the frame runtime or effects. */
export interface MotionPolicy {
  readonly reduced: boolean;
  retain(): void;
  release(): void;
  subscribe(callback: () => void): () => void;
}

export function createMotionPolicy(): MotionPolicy {
  let references = 0;
  let reduced = false;
  let generation = 0;
  let media: MediaQueryList | undefined;
  let observer: MutationObserver | undefined;
  let onChange: (() => void) | undefined;
  let notifying = false;
  let pending = false;
  const subscribers = new Set<{ callback: () => void }>();

  function read(currentMedia?: MediaQueryList): boolean {
    if (typeof document === 'undefined') return false;
    if (document.documentElement?.getAttribute('data-motion-policy') === 'reduce') return true;
    return currentMedia?.matches ?? (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false);
  }

  function refresh() {
    if (!references) return;
    if (notifying) { pending = true; return; }
    const currentGeneration = generation;
    do {
      pending = false;
      const next = read(media);
      if (next === reduced) continue;
      reduced = next;
      notifying = true;
      try {
        for (const subscription of [...subscribers]) {
          if (generation !== currentGeneration) break;
          if (!subscribers.has(subscription)) continue;
          try { subscription.callback(); } catch (error) {
            // A faulty listener or error reporter must not interrupt other listeners.
            try {
              if (typeof globalThis.reportError === 'function') globalThis.reportError(error);
              else console.error(error);
            } catch { /* reporting is best effort */ }
          }
        }
      } finally { notifying = false; }
    } while (pending && generation === currentGeneration && references > 0);
    // A listener may release and reactivate the store before causing another change.
    if (pending && references > 0 && generation !== currentGeneration) refresh();
  }

  function cleanup() {
    references = 0;
    generation++;
    const oldMedia = media;
    const oldObserver = observer;
    const oldOnChange = onChange;
    media = undefined;
    observer = undefined;
    onChange = undefined;
    subscribers.clear();
    pending = false;
    let failed = false;
    let failure: unknown;
    try { if (oldOnChange) oldMedia?.removeEventListener?.('change', oldOnChange); }
    catch (error) { failed = true; failure = error; }
    try { oldObserver?.disconnect(); }
    catch (error) { if (!failed) { failed = true; failure = error; } }
    if (failed) throw failure;
  }

  return {
    get reduced() {
      if (references) { refresh(); return reduced; }
      return read();
    },
    retain() {
      if (references > 0) { references++; return; }
      references = 1;
      generation++;
      try {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          media = typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined;
          reduced = read(media);
          const currentGeneration = generation;
          onChange = () => { if (generation === currentGeneration) refresh(); };
          media?.addEventListener?.('change', onChange);
          if (typeof MutationObserver !== 'undefined' && document.documentElement) {
            observer = new MutationObserver(onChange);
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion-policy'] });
          }
        } else reduced = false;
      } catch (error) {
        // Preserve the installation error even if rollback itself fails.
        try { cleanup(); } catch { /* best-effort rollback */ }
        throw error;
      }
    },
    release() {
      if (!references || --references) return;
      cleanup();
    },
    subscribe(callback) {
      if (!references) throw new Error('Motion policy must be retained before subscribing');
      const subscription = { callback };
      subscribers.add(subscription);
      return () => { subscribers.delete(subscription); };
    },
  };
}
