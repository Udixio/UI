/** Internal experiment. Offers only decide; effects start after offer returns.
 * The owner must revalidate nodes and observe policy during any accepted effect.
 * Call recheck on eligibility and policy notifications. No DOM is accessed.
 * Transfer succeeds only after start returns with the owner and coordinator alive;
 * otherwise the coordinator releases the idempotent lease. */
export interface RetentionLease { release(): void }
type Outcome<N> = { kind: 'expired' } | { kind: 'consumed'; source: N; destination: N };
type Input<N, D> = { key: string; document: D; source: N; lease: RetentionLease; owner: { alive: boolean }; reduced(): boolean; applyReduced(): void; offer(outcome: Outcome<N>): boolean; start(lease: RetentionLease, outcome: Outcome<N>): void };
type Dependencies<N, D> = { now(): number; schedule(callback: () => void, delay: number): () => void; resolve(key: string, document: D): N | undefined; eligible(node: N, document: D, source: boolean): boolean };
export function createRetentionCoordinator<N, D>(deps: Dependencies<N, D>) {
  const active = new Map<D, Map<string, object>>();
  const attempts = new Set<() => void>();
  let disposed = false;
  function begin(input: Input<N, D>) {
    let pending = true, released = false, deadline = 0;
    let cancelTimer: (() => void) | undefined;
    let timerToken: object | undefined;
    const token = {};
    const lease = { release() { if (!released) { released = true; input.lease.release(); } } };
    const handle = { accepted: true, recheck, cancel: () => finish('cancelled') };
    function finish(kind: 'cancelled' | 'reduced' | 'offer', outcome?: Outcome<N>) {
      if (!pending) return;
      pending = false;
      const map = active.get(input.document);
      if (map?.get(input.key) === token) { map.delete(input.key); if (!map.size) active.delete(input.document); }
      attempts.delete(handle.cancel);
      const errors: unknown[] = [];
      timerToken = undefined;
      try { cancelTimer?.(); } catch (e) { errors.push(e); }
      cancelTimer = undefined;
      let transferred = false;
      try {
        if (!errors.length && kind === 'reduced' && input.owner.alive && !disposed) input.applyReduced();
        if (!errors.length && kind === 'offer' && outcome && input.owner.alive && !disposed) {
          const reduced = input.reduced();
          if (!input.owner.alive || disposed) { /* revoked during policy read */ }
          else if (reduced) input.applyReduced();
          else {
            const accepted = input.offer(outcome);
            const reducedAfterOffer = input.owner.alive && !disposed ? input.reduced() : false;
            if (accepted && input.owner.alive && !disposed && !reducedAfterOffer) {
              transferred = true;
              try { input.start(lease, outcome); if (disposed || !input.owner.alive) transferred = false; } catch (e) { transferred = false; throw e; }
            } else if (input.owner.alive && !disposed && reducedAfterOffer) input.applyReduced();
          }
        }
      } catch (e) { errors.push(e); }
      finally { if (!transferred) try { lease.release(); } catch (e) { errors.push(e); } }
      if (errors.length === 1) throw errors[0];
      if (errors.length) throw new AggregateError(errors);
    }
    function stillLive() {
      if (!pending) return false;
      if (disposed || !input.owner.alive) { finish('cancelled'); return false; }
      return true;
    }
    function recheck() {
      if (!stillLive()) return;
      try {
        const sourceEligible = deps.eligible(input.source, input.document, true);
        if (!stillLive()) return;
        if (!sourceEligible) return finish('cancelled');
        const reduced = input.reduced();
        if (!stillLive()) return;
        if (reduced) return finish('reduced');
        const now = deps.now();
        if (!stillLive()) return;
        if (now >= deadline) return finish('offer', { kind: 'expired' });
        const destination = deps.resolve(input.key, input.document);
        if (!stillLive()) return;
        if (destination === undefined || destination === input.source) return;
        const eligible = deps.eligible(destination, input.document, false);
        if (!stillLive()) return;
        if (eligible) finish('offer', { kind: 'consumed', source: input.source, destination });
      } catch (e) { try { finish('cancelled'); } catch (cleanup) { throw new AggregateError([e, cleanup]); } throw e; }
    }
    try {
      const map = active.get(input.document);
      if (disposed || map?.has(input.key)) { pending = false; handle.accepted = false; lease.release(); return handle; }
      const group = map ?? new Map<string, object>(); group.set(input.key, token); active.set(input.document, group); attempts.add(handle.cancel);
      deadline = deps.now() + 600;
      recheck();
      if (pending) {
        const arm = () => {
          const remaining = Math.max(0, deadline - deps.now());
          if (!stillLive()) return;
          const current = {}; timerToken = current;
          let synchronous = true;
          const cancel = deps.schedule(() => {
            if (synchronous) throw new Error('Synchronous timer unsupported');
            if (!pending || timerToken !== current) return;
            timerToken = undefined; cancelTimer = undefined;
            try {
              recheck();
              if (pending) arm();
            } catch (error) {
              try { finish('cancelled'); } catch (cleanup) { throw new AggregateError([error, cleanup]); }
              throw error;
            }
          }, remaining);
          synchronous = false;
          if (pending) { cancelTimer = cancel; stillLive(); } else cancel();
        };
        arm();
      }
    } catch (e) { try { finish('cancelled'); } catch (cleanup) { throw new AggregateError([e, cleanup]); } throw e; }
    return handle;
  }
  function dispose() {
    disposed = true;
    const errors: unknown[] = [];
    for (const cancel of [...attempts]) try { cancel(); } catch (e) { errors.push(e); }
    if (errors.length === 1) throw errors[0];
    if (errors.length) throw new AggregateError(errors);
  }
  return { begin, dispose };
}
