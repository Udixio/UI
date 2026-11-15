import { describe, expect, it, vi } from 'vitest';
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

  it('calls the other listeners and keeps the definition when a listener throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const called: string[] = [];
    const unsubscribeThrowing = onMotionDefined(() => {
      throw new Error('listener failure');
    });
    const unsubscribeSecond = onMotionDefined(ref => called.push(ref.name));
    const ref = defineMotion('isolated-listener', spec);
    unsubscribeThrowing();
    unsubscribeSecond();
    expect(resolveMotion('isolated-listener')).toBe(ref);
    expect(called).toEqual(['isolated-listener']);
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
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

  it('accepts scaleX and scaleY frames', () => {
    expect(
      validateMotionSpec({
        verb: 'appear',
        keyframes: [{ scaleX: 0 }, { scaleX: 1, scaleY: 1 }],
      }).keyframes,
    ).toEqual([{ scaleX: 0 }, { scaleX: 1, scaleY: 1 }]);
  });

  it('rejects a frame that mixes scale with scaleX or scaleY', () => {
    expect(() =>
      validateMotionSpec({ verb: 'appear', keyframes: [{ scale: 1, scaleX: 2 }] }),
    ).toThrow(TypeError);
    expect(() =>
      validateMotionSpec({ verb: 'appear', keyframes: [{ scale: 1, scaleY: 2 }] }),
    ).toThrow('/spec/keyframes/0: conflict');
  });
});

describe('validateMotionSpec identity', () => {
  it('returns the same canonical object for structurally equal specs written in another key order', () => {
    const first = validateMotionSpec({
      verb: 'appear',
      keyframes: [{ opacity: 0, y: 16 }, { opacity: 1, y: 0 }],
      stagger: 'normal',
    });
    const second = validateMotionSpec({
      stagger: 'normal',
      keyframes: [{ y: 16, opacity: 0 }, { y: 0, opacity: 1 }],
      verb: 'appear',
    });
    expect(second).toBe(first);
  });
});

describe('layout motions', () => {
  it('accepts a layout spec without keyframes and stores it with empty keyframes', () => {
    const ref = defineMotion('layout-bare', { verb: 'layout' });
    expect(ref.spec).toEqual({ verb: 'layout', keyframes: [] });
    expect(Object.isFrozen(ref.spec.keyframes)).toBe(true);
  });

  it('treats an explicit empty keyframes array as the same definition', () => {
    const first = defineMotion('layout-same', { verb: 'layout' });
    expect(defineMotion('layout-same', { verb: 'layout', keyframes: [] })).toBe(first);
  });

  it('rejects non-empty keyframes on a layout spec at /spec/keyframes', () => {
    expect(() =>
      defineMotion('layout-keyed', { verb: 'layout', keyframes: [{ x: 1 }] } as never),
    ).toThrow('/spec/keyframes: unsupported');
  });

  it('accepts interrupt on a layout spec and keeps it', () => {
    expect(defineMotion('layout-interrupt', { verb: 'layout', interrupt: 'restart' }).spec.interrupt).toBe('restart');
  });

  it('still rejects interrupt on an appear spec', () => {
    expect(() =>
      defineMotion('appear-interrupt', { verb: 'appear', keyframes: [{ opacity: 1 }], interrupt: 'carry' } as never),
    ).toThrow('/spec/interrupt: unsupported');
  });
});

describe('stagger and origin', () => {
  it('accepts stagger and origin on appear and disappear', () => {
    const entering = defineMotion('stagger-enter', {
      verb: 'appear',
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      stagger: 'normal',
      origin: 'last',
    });
    expect(entering.spec).toMatchObject({ stagger: 'normal', origin: 'last' });
    const leaving = defineMotion('stagger-leave', {
      verb: 'disappear',
      keyframes: [{ opacity: 1 }, { opacity: 0 }],
      stagger: 'loose',
    });
    expect(leaving.spec).toMatchObject({ stagger: 'loose' });
  });

  it('accepts origin without stagger and keeps it', () => {
    expect(
      defineMotion('origin-alone', {
        verb: 'appear',
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        origin: 'center',
      }).spec,
    ).toMatchObject({ origin: 'center' });
  });

  it('refuses stagger and origin on layout and emphasize at their own paths', () => {
    expect(() =>
      defineMotion('stagger-layout', { verb: 'layout', stagger: 'tight' } as never),
    ).toThrow('/spec/stagger: unsupported');
    expect(() =>
      defineMotion('origin-layout', { verb: 'layout', origin: 'first' } as never),
    ).toThrow('/spec/origin: unsupported');
    expect(() =>
      defineMotion('stagger-emphasis', {
        verb: 'emphasize',
        keyframes: [{ scale: 1 }],
        stagger: 'normal',
      } as never),
    ).toThrow('/spec/stagger: unsupported');
  });

  it('rejects a stagger token or origin outside its domain', () => {
    expect(() =>
      defineMotion('stagger-huge', {
        verb: 'appear',
        keyframes: [{ opacity: 1 }],
        stagger: 'huge',
      } as never),
    ).toThrow('/spec/stagger: invalid_value');
    expect(() =>
      defineMotion('origin-side', {
        verb: 'appear',
        keyframes: [{ opacity: 1 }],
        origin: 'right',
      } as never),
    ).toThrow('/spec/origin: invalid_value');
  });
});

describe('exit', () => {
  it('accepts exit on appear and disappear and keeps it', () => {
    expect(
      defineMotion('exit-enter', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }], exit: 'out-of-flow' }).spec,
    ).toMatchObject({ exit: 'out-of-flow' });
    expect(
      defineMotion('exit-leave', { verb: 'disappear', keyframes: [{ opacity: 1 }, { opacity: 0 }], exit: 'in-place' }).spec,
    ).toMatchObject({ exit: 'in-place' });
  });

  it('refuses exit on layout and emphasize at /spec/exit', () => {
    expect(() => defineMotion('exit-layout', { verb: 'layout', exit: 'in-place' } as never)).toThrow('/spec/exit: unsupported');
    expect(() =>
      defineMotion('exit-emphasis', { verb: 'emphasize', keyframes: [{ scale: 1 }], exit: 'in-place' } as never),
    ).toThrow('/spec/exit: unsupported');
  });

  it('rejects an exit value outside its domain', () => {
    expect(() =>
      defineMotion('exit-vanish', { verb: 'appear', keyframes: [{ opacity: 1 }], exit: 'vanish' } as never),
    ).toThrow('/spec/exit: invalid_value');
  });
});

describe('motion manifest with exit', () => {
  it('no longer lists exit as deferred, and documents its domain', () => {
    expect(motionManifest.spec.deferred).not.toContain('exit');
    expect(motionManifest.deferredDomains).not.toHaveProperty('exit');
    expect(motionManifest.domains.exit).toEqual(['in-place', 'out-of-flow']);
  });
});

describe('motion manifest without trigger', () => {
  it('no longer lists trigger as deferred or as a deferred domain', () => {
    expect(motionManifest.spec.deferred).not.toContain('trigger');
    expect(motionManifest.deferredDomains).not.toHaveProperty('trigger');
  });
});
