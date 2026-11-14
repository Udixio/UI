import { describe, expect, it } from 'vitest';
import {
  defineMotion,
  definedMotions,
  onMotionDefined,
  resolveMotion,
  validateMotionSpec,
} from './define-motion.js';
import { motionManifest, type MotionDocument } from './manifest.js';

type MotionSpec = MotionDocument['spec'];

const spec: MotionSpec = {
  verb: 'appear',
  keyframes: [{ opacity: 0 }, { opacity: 1 }],
};

describe('defineMotion', () => {
  it('returns a frozen reference that resolveMotion returns unchanged', () => {
    const ref = defineMotion('card-enter', spec);
    expect(ref.name).toBe('card-enter');
    expect(Object.isFrozen(ref)).toBe(true);
    expect(resolveMotion('card-enter')).toBe(ref);
  });

  it('rejects names that are not kebab-case or are reserved', () => {
    for (const name of ['enter', 'view-transition-x', 'CardEnter', '']) {
      expect(() => defineMotion(name, spec)).toThrow(TypeError);
    }
  });

  it('reports unsupported verbs with their validator path', () => {
    expect(() =>
      defineMotion('reveal-card', {
        verb: 'reveal',
        keyframes: [{ opacity: 1 }],
      } as never),
    ).toThrow(/\/verb: unsupported/);
  });

  it('rejects the author-writable trigger option', () => {
    expect(() =>
      defineMotion('trigger-card', {
        verb: 'appear',
        keyframes: [{ opacity: 1 }],
        trigger: 'load',
      } as never),
    ).toThrow(/\/spec\/trigger: unknown_field/);
  });

  it('returns the same reference for an identical redefinition', () => {
    const first = defineMotion('same-card', spec);
    expect(defineMotion('same-card', { ...spec, keyframes: [{ opacity: 0 }, { opacity: 1 }] })).toBe(first);
  });

  it('throws an Error naming the motion when the spec differs', () => {
    defineMotion('different-card', spec);
    expect(() =>
      defineMotion('different-card', { verb: 'appear', keyframes: [{ opacity: 0.5 }] }),
    ).toThrow(/different-card/);
  });

  it('keeps the registry on globalThis under the shared symbol', () => {
    const ref = defineMotion('shared-card', spec);
    const registry = (globalThis as unknown as Record<symbol, Map<string, unknown>>)[
      Symbol.for('udixio.motion.definitions.preview.1')
    ];
    expect(registry).toBeInstanceOf(Map);
    expect(registry?.get('shared-card')).toBe(ref);
  });

  it('notifies listeners for each new definition until unsubscribed', () => {
    const seen: string[] = [];
    const unsubscribe = onMotionDefined(ref => seen.push(ref.name));
    defineMotion('listened-one', spec);
    unsubscribe();
    defineMotion('listened-two', spec);
    expect(seen).toEqual(['listened-one']);
  });

  it('lists the defined names in definition order', () => {
    defineMotion('ordered-first', spec);
    defineMotion('ordered-second', spec);
    const names = definedMotions();
    expect(names).toContain('ordered-first');
    expect(names.indexOf('ordered-second')).toBeGreaterThan(names.indexOf('ordered-first'));
  });
});

describe('validateMotionSpec', () => {
  it('returns a frozen copy in manifest key order', () => {
    const validated = validateMotionSpec({
      keyframes: [{ y: 1, opacity: 0 }],
      reduced: 'fade',
      verb: 'appear',
    });
    expect(JSON.stringify(validated)).toBe(
      '{"verb":"appear","keyframes":[{"opacity":0,"y":1}],"reduced":"fade"}',
    );
    expect(Object.isFrozen(validated)).toBe(true);
  });
});

describe('motion manifest without trigger', () => {
  it('no longer lists trigger as deferred or as a deferred domain', () => {
    expect(motionManifest.spec.deferred).not.toContain('trigger');
    expect(motionManifest.deferredDomains).not.toHaveProperty('trigger');
  });
});
