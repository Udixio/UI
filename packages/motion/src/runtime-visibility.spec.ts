import { afterEach, expect, it, vi } from 'vitest';
import { getMotionRuntime } from './runtime.js';

const key = Symbol.for('udixio.motion.frame-runtime.preview.7');
afterEach(() => { delete (globalThis as Record<symbol, unknown>)[key]; vi.unstubAllGlobals(); });

it('holds roots pending and rejects callbacks from replaced observers', () => {
  const doc = new EventTarget() as Document;
  Object.defineProperty(doc, 'visibilityState', { value: 'visible' });
  vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  const frames = new Map<number, FrameRequestCallback>(); let next = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const observers: FakeObserver[] = [];
  class FakeObserver {
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() {} disconnect() {}
    emit(target: Element, isIntersecting: boolean) { this.callback([{ target, isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element;
  const tick = vi.fn();
  const removeA = runtime.subscribe('a', { tick }, { root: a });
  runtime.subscribe('b', { tick }, { root: b });
  expect(frames.size).toBe(0);
  observers[0].emit(b, true); expect(frames.size).toBe(1);
  removeA(); expect(frames.size).toBe(0);
  observers[0].emit(b, true); expect(frames.size).toBe(0);
  observers[1].emit(b, true); expect(frames.size).toBe(1);
  runtime.release();
});

it('recovers explicitly after reconstruction fails and keeps new roots pending', () => {
  const doc = new EventTarget() as Document;
  vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  const frames = new Map<number, FrameRequestCallback>(); let next = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const observers: FakeObserver[] = []; let fail = false;
  class FakeObserver {
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() { if (fail) throw new Error('observe failed'); }
    disconnect() {}
    emit(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element; const c = { ownerDocument: doc } as Element;
  const removeA = runtime.subscribe('a', { tick() {} }, { root: a });
  runtime.subscribe('b', { tick() {} }, { root: b });
  observers[0].emit(b); expect(frames.size).toBe(1);
  fail = true; expect(removeA).toThrow('observe failed'); expect(frames.size).toBe(0);
  runtime.subscribe('c', { tick() {} }, { root: c });
  observers[1].emit(b); expect(frames.size).toBe(0);
  expect(() => runtime.retryVisibility()).toThrow('observe failed');
  fail = false; runtime.retryVisibility(); expect(frames.size).toBe(0);
  observers.at(-1)!.emit(b); expect(frames.size).toBe(1);
  runtime.release();
});

it('rebuilds existing roots after a new observation fails and reports both failures', () => {
  const doc = new EventTarget() as Document;
  vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  let calls = 0; let failures = true; const instances: FakeObserver[] = [];
  class FakeObserver {
    constructor(readonly callback: IntersectionObserverCallback) { instances.push(this); }
    observe() { if (++calls > 1 && failures) throw new Error(`failure ${calls}`); }
    disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element;
  runtime.subscribe('a', { tick() {} }, { root: a });
  try { runtime.subscribe('b', { tick() {} }, { root: b }); expect.fail('expected failure'); }
  catch (error) { expect(error).toBeInstanceOf(AggregateError); expect((error as AggregateError).errors.map((e: Error) => e.message)).toEqual(['failure 2', 'failure 3']); }
  failures = false; runtime.retryVisibility(); expect(instances).toHaveLength(3);
  runtime.release();
});

it('allows roots immediately without the observer API and rejects foreign documents atomically', () => {
  const doc = new EventTarget() as Document;
  vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  vi.stubGlobal('IntersectionObserver', undefined);
  const raf = vi.fn(() => 1); vi.stubGlobal('requestAnimationFrame', raf);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  expect(() => runtime.subscribe('foreign', { tick() {} }, { root: { ownerDocument: {} } as Element })).toThrow();
  expect(raf).not.toHaveBeenCalled();
  runtime.subscribe('local', { tick() {} }, { root: { ownerDocument: doc } as Element });
  expect(raf).toHaveBeenCalledTimes(1);
  runtime.release();
});

it('stops processing an old batch after a reentrant removal and re-registration', () => {
  const doc = new EventTarget() as Document;
  vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  let onCancel = () => {}; let next = 0; const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id); onCancel(); });
  const observers: FakeObserver[] = [];
  class FakeObserver {
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() {} disconnect() {}
    emit(entries: IntersectionObserverEntry[]) { this.callback(entries, this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element;
  const removeA = runtime.subscribe('a', { tick() {} }, { root: a });
  runtime.subscribe('b', { tick() {} }, { root: b });
  const entry = (target: Element, isIntersecting: boolean) => ({ target, isIntersecting }) as IntersectionObserverEntry;
  observers[0].emit([entry(b, true)]); expect(frames.size).toBe(1);
  onCancel = () => { onCancel = () => {}; removeA(); runtime.subscribe('a2', { tick() {} }, { root: a }); };
  observers[0].emit([entry(b, false), entry(a, true)]);
  expect(observers).toHaveLength(2); expect(frames.size).toBe(0);
  observers[1].emit([entry(a, true)]); expect(frames.size).toBe(1);
  runtime.release();
});

it('rolls back constructor failure and permits a later registration', () => {
  const doc = new EventTarget() as Document; vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  let fails = true; let observed = 0;
  class FakeObserver {
    constructor() { if (fails) throw new Error('constructor failed'); }
    observe() { observed++; } disconnect() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const root = { ownerDocument: doc } as Element;
  expect(() => runtime.subscribe('a', { tick() {} }, { root })).toThrow('constructor failed');
  fails = false; runtime.subscribe('a', { tick() {} }, { root }); expect(observed).toBe(1);
  runtime.release();
});

it('ignores callbacks and unsubscribe handles from a released generation', () => {
  const doc = new EventTarget() as Document; vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  const frames = new Map<number, FrameRequestCallback>(); let next = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  const observers: FakeObserver[] = [];
  class FakeObserver {
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() {} disconnect() {}
    emit(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); const root = { ownerDocument: doc } as Element;
  runtime.retain(); const staleRemove = runtime.subscribe('old', { tick() {} }, { root }); runtime.release();
  runtime.retain(); runtime.subscribe('new', { tick() {} }, { root });
  staleRemove(); observers[0].emit(root); expect(frames.size).toBe(0);
  observers[1].emit(root); expect(frames.size).toBe(1); runtime.release();
});

it('does not replace a new generation observer after cancellation reenters release and retain', () => {
  const doc = new EventTarget() as Document; vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  let onCancel = () => {}; let next = 0; const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { frames.delete(id); onCancel(); });
  const observers: FakeObserver[] = [];
  class FakeObserver {
    active = true;
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() {} disconnect() { this.active = false; }
    emit(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element; const c = { ownerDocument: doc } as Element;
  const removeA = runtime.subscribe('a', { tick() {} }, { root: a });
  runtime.subscribe('b', { tick() {} }, { root: b }); observers[0].emit(b);
  onCancel = () => { onCancel = () => {}; runtime.release(); runtime.retain(); runtime.subscribe('c', { tick() {} }, { root: c }); };
  removeA();
  expect(observers.filter(observer => observer.active)).toHaveLength(1);
  runtime.release(); expect(observers.filter(observer => observer.active)).toHaveLength(0);
});

it('keeps remaining roots pending and permits retry after disconnect throws', () => {
  const doc = new EventTarget() as Document; vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  let next = 0; const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  let fail = true; const observers: FakeObserver[] = [];
  class FakeObserver {
    active = true;
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() {} disconnect() { if (fail) throw new Error('disconnect failed'); this.active = false; }
    emit(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element;
  const removeA = runtime.subscribe('a', { tick() {} }, { root: a });
  runtime.subscribe('b', { tick() {} }, { root: b }); observers[0].emit(b);
  expect(() => removeA()).toThrow('disconnect failed'); expect(frames.size).toBe(0);
  expect(() => runtime.retryVisibility()).toThrow('disconnect failed');
  expect(observers).toHaveLength(1);
  fail = false; runtime.retryVisibility(); expect(observers.filter(observer => observer.active)).toHaveLength(1);
  observers[0].emit(b); expect(frames.size).toBe(0);
  observers[1].emit(b); expect(frames.size).toBe(1);
  runtime.release(); expect(observers.filter(observer => observer.active)).toHaveLength(0);
});

it('suspends existing roots if cleanup of a failed new observation also fails', () => {
  const doc = new EventTarget() as Document; vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
  let next = 0; const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  let observeCount = 0; let failDisconnect = true; const observers: FakeObserver[] = [];
  class FakeObserver {
    constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
    observe() { if (++observeCount === 2) throw new Error('observe failed'); }
    disconnect() { if (failDisconnect) throw new Error('disconnect failed'); }
    emit(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  const runtime = getMotionRuntime({ development: false }); runtime.retain();
  const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element;
  runtime.subscribe('a', { tick() {} }, { root: a }); observers[0].emit(a);
  expect(() => runtime.subscribe('b', { tick() {} }, { root: b })).toThrow(AggregateError);
  expect(frames.size).toBe(0);
  failDisconnect = false; runtime.retryVisibility(); observers[1].emit(a); expect(frames.size).toBe(1);
  runtime.release();
});

for (const shouldThrow of [false, true]) {
  it(`does not retain an obsolete subscription when observe reenters a new generation (${shouldThrow ? 'error' : 'success'})`, () => {
    const doc = new EventTarget() as Document; vi.stubGlobal('window', globalThis); vi.stubGlobal('document', doc);
    let next = 0; const frames = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frames.set(++next, cb); return next; });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    const observers: FakeObserver[] = []; let reenter = false; let trigger = () => {};
    class FakeObserver {
      constructor(readonly callback: IntersectionObserverCallback) { observers.push(this); }
      observe() { if (reenter) { reenter = false; trigger(); if (shouldThrow) throw new Error('observe failure'); } }
      disconnect() {}
      emit(target: Element) { this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const runtime = getMotionRuntime({ development: false }); runtime.retain();
    const a = { ownerDocument: doc } as Element; const b = { ownerDocument: doc } as Element;
    runtime.subscribe('old-a', { tick() {} }, { root: a });
    const oldTick = vi.fn(); const newTick = vi.fn();
    trigger = () => { runtime.release(); runtime.retain(); runtime.subscribe('new-b', { tick: newTick }, { root: b }); };
    reenter = true;
    try { runtime.subscribe('old-b', { tick: oldTick }, { root: b }); } catch { /* either path may reject the obsolete registration */ }
    observers[0].emit(b); expect(frames.size).toBe(0);
    observers[1].emit(b); expect(frames.size).toBe(1);
    const frame = [...frames.values()][0]; frames.clear(); frame(1);
    expect(newTick).toHaveBeenCalledOnce(); expect(oldTick).not.toHaveBeenCalled();
    runtime.release();
  });
}
