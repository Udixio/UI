import { expect, it, vi } from 'vitest';
import { createRetentionCoordinator } from './retention-experiment.js';

function setup() {
  let now = 0;
  let wake: (() => void) | undefined;
  let destination: object | undefined;
  const release = vi.fn();
  const owner = { alive: true };
  const offer = vi.fn((_outcome: { kind: 'expired' } | { kind: 'consumed'; source: object; destination: object }) => true);
  const start = vi.fn((_lease: { release(): void }, _outcome: { kind: 'expired' } | { kind: 'consumed'; source: object; destination: object }) => {});
  const c = createRetentionCoordinator<object, object>({
    now: () => now, schedule: cb => { wake = cb; return () => { wake = undefined; }; },
    resolve: () => destination, eligible: () => true,
  });
  const source = {};
  const input = { key: 'x', document: {}, source, lease: { release }, owner, offer, start, reduced: () => false, applyReduced: vi.fn() };
  return { c, input, release, offer, start, owner, setTime: (n: number) => { now = n; }, setDestination: (d: object) => { destination = d; }, wake: () => wake?.() };
}

it('transfers only after synchronous acceptance and releases when the recipient finishes', () => {
  const s = setup(); s.setDestination({});
  s.c.begin(s.input);
  expect(s.offer).toHaveBeenCalledOnce(); expect(s.start).toHaveBeenCalledOnce(); expect(s.release).not.toHaveBeenCalled();
  s.start.mock.calls[0][0].release(); s.start.mock.calls[0][0].release();
  expect(s.release).toHaveBeenCalledOnce();
});

it('expires at 600ms even when the wakeup is late', () => {
  const s = setup(); const h = s.c.begin(s.input); s.setTime(600); s.setDestination({}); h.recheck();
  expect(s.offer.mock.calls[0][0]).toEqual({ kind: 'expired' });
  expect(s.start).toHaveBeenCalledOnce();
});

it('releases on refusal and leaves a new attempt possible', () => {
  const s = setup(); s.offer.mockReturnValue(false); s.setDestination({}); s.c.begin(s.input);
  expect(s.release).toHaveBeenCalledOnce(); s.c.begin({ ...s.input, lease: { release: vi.fn() } });
  expect(s.offer).toHaveBeenCalledTimes(2);
});

it('applies reduced state before releasing the lease', () => {
  const s = setup(); const order: string[] = [];
  s.c.begin({ ...s.input, reduced: () => true, applyReduced: () => order.push('reduced'), lease: { release: () => order.push('release') } });
  expect(order).toEqual(['reduced', 'release']);
});

it('rejects a second source without disturbing the first', () => {
  const s = setup(); const first = s.c.begin(s.input); const other = vi.fn();
  const second = s.c.begin({ ...s.input, lease: { release: other } });
  expect(first.accepted).toBe(true); expect(second.accepted).toBe(false); expect(other).toHaveBeenCalledOnce();
  s.setDestination({}); first.recheck(); expect(s.start).toHaveBeenCalledOnce();
});

it('cleans up after a throwing offer and permits a new attempt', () => {
  const s = setup(); s.setDestination({}); s.offer.mockImplementationOnce(() => { throw Error('offer'); });
  expect(() => s.c.begin(s.input)).toThrow('offer'); expect(s.release).toHaveBeenCalledOnce();
  expect(s.c.begin({ ...s.input, lease: { release: vi.fn() } }).accepted).toBe(true);
});

it('does not transfer if the owner dies during the offer', () => {
  const s = setup(); s.setDestination({}); s.offer.mockImplementation(() => { s.owner.alive = false; return true; });
  s.c.begin(s.input); expect(s.start).not.toHaveBeenCalled(); expect(s.release).toHaveBeenCalledOnce();
});

it('accepts a live destination just before the deadline', () => {
  const s = setup(); const h = s.c.begin(s.input); s.setTime(599.999); const destination = {}; s.setDestination(destination); h.recheck();
  expect(s.offer.mock.calls[0][0]).toEqual({ kind: 'consumed', source: s.input.source, destination });
});

it('does not offer or start when reading policy disposes the coordinator', () => {
  const s = setup(); s.setDestination({}); let calls = 0;
  s.c.begin({ ...s.input, reduced: () => { if (++calls === 2) s.c.dispose(); return false; } });
  expect(s.offer).not.toHaveBeenCalled(); expect(s.start).not.toHaveBeenCalled(); expect(s.release).toHaveBeenCalledOnce();
});

it('does not schedule after clock reading disposes the attempt', () => {
  let clockCalls = 0;
  const schedule = vi.fn(() => () => {}); const release = vi.fn();
  const c = createRetentionCoordinator<object, object>({ now: () => { if (++clockCalls === 3) c.dispose(); return 0; }, schedule, resolve: () => undefined, eligible: () => true });
  c.begin({ key: 'x', document: {}, source: {}, lease: { release }, owner: { alive: true }, reduced: () => false, applyReduced() {}, offer: () => false, start() {} });
  expect(schedule).not.toHaveBeenCalled(); expect(release).toHaveBeenCalledOnce();
});

it('ignores a timer callback repeated after an early wake', () => {
  const callbacks: (() => void)[] = []; const cancelled = vi.fn();
  const c = createRetentionCoordinator<object, object>({ now: () => 0, schedule: cb => { callbacks.push(cb); return cancelled; }, resolve: () => undefined, eligible: () => true });
  const h = c.begin({ key: 'x', document: {}, source: {}, lease: { release() {} }, owner: { alive: true }, reduced: () => false, applyReduced() {}, offer: () => false, start() {} });
  callbacks[0](); callbacks[0](); expect(callbacks).toHaveLength(2); h.cancel(); expect(cancelled).toHaveBeenCalledOnce();
});

it('reports falsy errors and cleans up every pending lease', () => {
  const c = createRetentionCoordinator<object, object>({ now: () => 0, schedule: () => () => {}, resolve: () => undefined, eligible: () => true });
  const second = vi.fn(); const doc = {};
  const input = { key: 'x', document: doc, source: {}, owner: { alive: true }, reduced: () => false, applyReduced() {}, offer: () => false, start() {} };
  c.begin({ ...input, lease: { release: () => { throw undefined; } } });
  c.begin({ ...input, key: 'y', lease: { release: second } });
  let caught = false; try { c.dispose(); } catch (e) { caught = true; expect(e).toBeUndefined(); }
  expect(caught).toBe(true); expect(second).toHaveBeenCalledOnce();
});

it('releases if the owner dies during start', () => {
  const s = setup(); s.setDestination({});
  s.start.mockImplementation(() => { s.owner.alive = false; });
  s.c.begin(s.input); expect(s.release).toHaveBeenCalledOnce();
});

it('does not start if the policy read after acceptance destroys the owner', () => {
  const s = setup(); s.setDestination({}); let calls = 0;
  s.c.begin({ ...s.input, reduced: () => { if (++calls === 3) s.owner.alive = false; return false; } });
  expect(s.offer).toHaveBeenCalledOnce(); expect(s.start).not.toHaveBeenCalled(); expect(s.release).toHaveBeenCalledOnce();
});

it('reports both a falsy offer error and a release error', () => {
  const s = setup(); s.setDestination({});
  let caught: unknown;
  try { s.c.begin({ ...s.input, offer: () => { throw false; }, lease: { release: () => { throw 0; } } }); } catch (e) { caught = e; }
  expect(caught).toBeInstanceOf(AggregateError);
  expect((caught as AggregateError).errors).toEqual([false, 0]);
});

it.each(['now', 'schedule'] as const)('rolls back when %s throws while rearming', failure => {
  let nowCalls = 0, scheduleCalls = 0; let wake: (() => void) | undefined;
  const release = vi.fn();
  const c = createRetentionCoordinator<object, object>({
    now: () => { if (++nowCalls === 5 && failure === 'now') throw false; return 0; },
    schedule: cb => { if (++scheduleCalls === 2 && failure === 'schedule') throw 0; wake = cb; return () => {}; },
    resolve: () => undefined, eligible: () => true,
  });
  const input = { key: 'x', document: {}, source: {}, lease: { release }, owner: { alive: true }, reduced: () => false, applyReduced() {}, offer: () => false, start() {} };
  c.begin(input);
  let caught = false; let error: unknown;
  try { wake?.(); } catch (e) { caught = true; error = e; }
  expect(caught).toBe(true); expect(error).toBe(failure === 'now' ? false : 0); expect(release).toHaveBeenCalledOnce();
  expect(c.begin({ ...input, lease: { release() {} } }).accepted).toBe(true);
});

it('applies reduced state when an offer switches policy then refuses', () => {
  const s = setup(); s.setDestination({}); let reduced = false; const order: string[] = [];
  s.c.begin({ ...s.input, reduced: () => reduced, offer: () => { reduced = true; return false; }, applyReduced: () => order.push('reduced'), lease: { release: () => order.push('release') } });
  expect(order).toEqual(['reduced', 'release']);
});
