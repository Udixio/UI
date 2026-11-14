import { describe, expect, it } from 'vitest';
import { probeWaapiEasing } from './waapi-probe.js';

function context(construct: (easing: string) => { getTiming(): { easing: string } }) {
  const calls: string[] = [];
  class Effect {
    getTiming: () => { easing: string };
    constructor(_target: Element, _frames: Keyframe[], options: KeyframeEffectOptions) {
      calls.push(options.easing!);
      this.getTiming = construct(options.easing!).getTiming;
    }
  }
  const detached = {};
  const document = { defaultView: { KeyframeEffect: Effect, TypeError }, createElement: () => detached };
  const target = { ownerDocument: document, animate() {} } as unknown as Element;
  return { target, calls };
}
const effect = (easing: string) => ({ getTiming: () => ({ easing }) });

describe('experimental WAAPI syntax probe', () => {
  it('reports parser acceptance and the returned serialization without asserting semantic support', () => {
    const c = context((easing) => effect(easing === 'candidate' ? 'linear' : easing));
    expect(probeWaapiEasing(c.target, 'candidate')).toEqual({ status: 'accepted', normalizedEasing: 'linear' });
    expect(c.calls).toEqual(['linear', 'candidate']);
  });
  it('reports refusal only for a candidate constructor realm TypeError after a positive control', () => {
    const c = context((easing) => { if (easing !== 'linear') throw new TypeError('bad'); return effect(easing); });
    expect(probeWaapiEasing(c.target, 'bad').status).toBe('refused');
  });
  it('classifies failed control, other constructor errors, and candidate getTiming errors as unknown', () => {
    const control = context(() => { throw new TypeError('control'); });
    expect(probeWaapiEasing(control.target, 'bad').status).toBe('unknown');
    expect(control.calls).toEqual(['linear']);
    const other = context((easing) => { if (easing !== 'linear') throw Error('bad'); return effect(easing); });
    expect(probeWaapiEasing(other.target, 'bad').status).toBe('unknown');
    const timing = context((easing) => easing === 'linear' ? effect(easing) : { getTiming: () => { throw new TypeError('timing'); } });
    expect(probeWaapiEasing(timing.target, 'bad').status).toBe('unknown');
  });
  it('handles missing and inaccessible contexts without throwing', () => {
    expect(probeWaapiEasing(undefined, 'linear').status).toBe('unknown');
    expect(probeWaapiEasing({ ownerDocument: { defaultView: null }, animate() {} } as unknown as Element, 'linear').status).toBe('unknown');
    expect(probeWaapiEasing({ get ownerDocument() { throw Error('inaccessible'); } } as unknown as Element, 'linear').status).toBe('unknown');
    const c = context(effect);
    delete (c.target as unknown as { animate?: unknown }).animate;
    expect(probeWaapiEasing(c.target, 'linear').status).toBe('unknown');
  });
  it('treats unavailable error identity and missing timing methods as unknown', () => {
    const c = context((easing) => { if (easing !== 'linear') throw new TypeError('bad'); return effect(easing); });
    (c.target.ownerDocument.defaultView as unknown as { TypeError?: unknown }).TypeError = undefined;
    expect(probeWaapiEasing(c.target, 'bad').status).toBe('unknown');
    const missing = context(() => ({} as { getTiming(): { easing: string } }));
    expect(probeWaapiEasing(missing.target, 'linear').status).toBe('unknown');
  });
  it('reads the effect constructor once and does not misclassify an inaccessible getter', () => {
    const c = context(effect);
    const view = c.target.ownerDocument.defaultView!;
    const constructor = view.KeyframeEffect;
    let reads = 0;
    Object.defineProperty(view, 'KeyframeEffect', { configurable: true, get() { if (++reads > 1) throw new TypeError('getter'); return constructor; } });
    expect(probeWaapiEasing(c.target, 'candidate').status).toBe('accepted');
    expect(reads).toBe(1);
    Object.defineProperty(view, 'KeyframeEffect', { configurable: true, get() { throw new TypeError('inaccessible'); } });
    expect(probeWaapiEasing(c.target, 'candidate').status).toBe('unknown');
  });

  it('does not trust substituted error constructors or custom instanceof behavior', () => {
    const c = context((easing) => { if (easing !== 'linear') throw Error('bad'); return effect(easing); });
    const view = c.target.ownerDocument.defaultView!;
    (view as unknown as { TypeError: unknown }).TypeError = Object;
    expect(probeWaapiEasing(c.target, 'bad').status).toBe('unknown');
    class FakeTypeError extends Error { static override [Symbol.hasInstance]() { return true; } }
    (view as unknown as { TypeError: unknown }).TypeError = FakeTypeError;
    expect(probeWaapiEasing(c.target, 'bad').status).toBe('unknown');
  });

});
