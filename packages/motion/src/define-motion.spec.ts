import { describe, expect, it, vi } from 'vitest';
import {
  defineMotion,
  defineShared,
  definedMotions,
  onMotionDefined,
  kindOf,
  readMotion,
  resolveMotion,
  validateMotionSpec,
  assertMotionName,
  assertName,
} from './define-motion.js';
import { motionManifest, type MotionDocument } from './manifest.js';
import { dip, grow, press } from './presets.js';
import { defineSequence } from './sequence.js';

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

  it('reports unknown verbs with their validator path', () => {
    expect(() =>
      defineMotion('bounce-card', {
        verb: 'bounce',
        keyframes: [{ opacity: 1 }],
      } as never),
    ).toThrow(/\/verb: invalid_value/);
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

  it('does not validate in production and returns the frozen canonical copy', () => {
    const valid = { verb: 'appear' as const, keyframes: [{ opacity: 1 }] };
    const canonical = validateMotionSpec(valid);
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const invalid = validateMotionSpec({
        verb: 'appear',
        keyframes: [{ opacity: 1, notAField: 2 }],
      });
      expect(Object.isFrozen(invalid)).toBe(true);
      expect(Object.isFrozen(invalid.keyframes)).toBe(true);
      expect(invalid.keyframes).toEqual([{ opacity: 1 }]);
      expect(validateMotionSpec(valid)).toBe(canonical);
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
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

describe('split', () => {
  it('accepts split on appear, disappear and reveal, and keeps it', () => {
    expect(
      defineMotion('split-enter', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }], split: 'chars' }).spec,
    ).toMatchObject({ split: 'chars' });
    expect(
      defineMotion('split-leave', { verb: 'disappear', keyframes: [{ opacity: 1 }, { opacity: 0 }], split: 'lines' }).spec,
    ).toMatchObject({ split: 'lines' });
    expect(
      defineMotion('split-reveal', { verb: 'reveal', keyframes: [{ opacity: 0 }, { opacity: 1 }], split: 'words' }).spec,
    ).toMatchObject({ split: 'words' });
  });

  it('refuses split on emphasize with a TypeError at its own path', () => {
    expect(() =>
      defineMotion('split-emphasis', { verb: 'emphasize', keyframes: [{ scale: 1 }], split: 'words' } as never),
    ).toThrow(TypeError);
    expect(() =>
      defineMotion('split-emphasis', { verb: 'emphasize', keyframes: [{ scale: 1 }], split: 'words' } as never),
    ).toThrow('/spec/split: unsupported');
  });

  it('rejects a split outside its domain', () => {
    expect(() =>
      defineMotion('split-sentences', { verb: 'appear', keyframes: [{ opacity: 1 }], split: 'sentences' } as never),
    ).toThrow('/spec/split: invalid_value');
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

describe('shared identity', () => {
  it('accepts shared on a layout and keeps it in the canonical spec', () => {
    const ref = defineMotion('shared-card-move', { verb: 'layout', shared: 'card' });
    expect(ref.spec.shared).toBe('card');
  });

  it('refuses shared on an appear at /spec/shared', () => {
    expect(() =>
      validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0 }], shared: 'card' }),
    ).toThrow(/\/spec\/shared: unsupported/);
  });

  it('refuses a key that is not kebab-case at /spec/shared', () => {
    expect(() => validateMotionSpec({ verb: 'layout', shared: 'Not Kebab' })).toThrow(/\/spec\/shared: invalid_value/);
  });

  it('defineShared returns its name and refuses a name that is not kebab-case', () => {
    expect(defineShared('hero')).toBe('hero');
    expect(() => defineShared('Not Kebab')).toThrow(TypeError);
  });
});

describe('reveal, scrub and loop motions', () => {
  it('accepts a reveal with its options, and with a spring or a curve timing', () => {
    expect(
      validateMotionSpec({
        verb: 'reveal',
        keyframes: [{ opacity: 0, y: 24 }, { opacity: 1, y: 0 }],
        repeat: 'once',
        axis: 'block',
        stagger: 'normal',
        origin: 'first',
        timing: 'spring.default.spatial',
        reduced: 'fade',
      }),
    ).toMatchObject({ verb: 'reveal', repeat: 'once', axis: 'block', stagger: 'normal', origin: 'first' });
    expect(
      validateMotionSpec({
        verb: 'reveal',
        keyframes: [{ opacity: 0 }],
        timing: { duration: 'duration.medium2', easing: 'easing.standard' },
      }),
    ).toMatchObject({ timing: { duration: 'duration.medium2', easing: 'easing.standard' } });
  });

  it('refuses exit, shared, interrupt, range and pause on a reveal at their own paths', () => {
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], exit: 'in-place' } as never)).toThrow('/spec/exit: unsupported');
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], shared: 'card' } as never)).toThrow('/spec/shared: unsupported');
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], interrupt: 'carry' } as never)).toThrow('/spec/interrupt: unsupported');
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], range: 'cross' } as never)).toThrow('/spec/range: unsupported');
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], pause: 'control' } as never)).toThrow('/spec/pause: unsupported');
  });

  it('rejects a repeat outside its domain at /spec/repeat', () => {
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], repeat: 'twice' } as never)).toThrow('/spec/repeat: invalid_value');
  });

  it('accepts a scrub with its range and axis, and refuses a timing of either kind', () => {
    expect(validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 48 }, { y: -48 }], range: 'cross', axis: 'inline' })).toMatchObject({
      range: 'cross',
      axis: 'inline',
    });
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], timing: 'spring.default.spatial' })).toThrow('/spec/timing: unsupported');
    expect(() =>
      validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], timing: { duration: 'duration.medium2', easing: 'easing.standard' } }),
    ).toThrow('/spec/timing: unsupported');
  });

  it('refuses repeat, stagger, origin, exit and interrupt on a scrub at their own paths', () => {
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], repeat: 'once' } as never)).toThrow('/spec/repeat: unsupported');
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], stagger: 'normal' } as never)).toThrow('/spec/stagger: unsupported');
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], origin: 'first' } as never)).toThrow('/spec/origin: unsupported');
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], exit: 'in-place' } as never)).toThrow('/spec/exit: unsupported');
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], interrupt: 'carry' } as never)).toThrow('/spec/interrupt: unsupported');
  });

  it('refuses reduced on a scrub, a loop and a layout, which follow reduced motion their own way', () => {
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], reduced: 'neutral' } as never)).toThrow('/spec/reduced: unsupported');
    expect(() => validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', reduced: 'frozen' } as never)).toThrow('/spec/reduced: unsupported');
    expect(() => validateMotionSpec({ verb: 'layout', reduced: 'instant' } as never)).toThrow('/spec/reduced: unsupported');
    expect(() => defineMotion('scrub-refused-reduced', { verb: 'scrub', keyframes: [{ y: 1 }], reduced: 'neutral' } as never)).toThrow('/spec/reduced: unsupported');
    expect(resolveMotion('scrub-refused-reduced')).toBeUndefined();
  });

  it('takes a reduced render only from the values its verb renders, and refuses the others', () => {
    expect(validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0 }], reduced: 'instant' })).toMatchObject({ reduced: 'instant' });
    expect(validateMotionSpec({ verb: 'emphasize', keyframes: [{ scale: 1 }], reduced: 'static' })).toMatchObject({ reduced: 'static' });
    expect(() => validateMotionSpec({ verb: 'appear', keyframes: [{ opacity: 0 }], reduced: 'static' } as never)).toThrow('/spec/reduced: invalid_value');
    expect(() => validateMotionSpec({ verb: 'emphasize', keyframes: [{ scale: 1 }], reduced: 'instant' } as never)).toThrow('/spec/reduced: invalid_value');
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], reduced: 'frozen' } as never)).toThrow('/spec/reduced: invalid_value');
  });

  it('rejects a range or an axis outside its domain', () => {
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], range: 'middle' } as never)).toThrow('/spec/range: invalid_value');
    expect(() => validateMotionSpec({ verb: 'scrub', keyframes: [{ y: 1 }], axis: 'diagonal' } as never)).toThrow('/spec/axis: invalid_value');
  });

  it('accepts a loop that the user can pause, with a curve timing', () => {
    expect(
      validateMotionSpec({
        verb: 'loop',
        keyframes: [{ rotate: 0 }, { rotate: 360 }],
        timing: { duration: 'duration.extraLong4', easing: 'easing.linear' },
        pause: 'control',
      }),
    ).toMatchObject({ pause: 'control', timing: { duration: 'duration.extraLong4', easing: 'easing.linear' } });
  });

  it('accepts an essential loop that gives its reason', () => {
    expect(
      validateMotionSpec({
        verb: 'loop',
        keyframes: [{ scale: 1 }, { scale: 1.04 }, { scale: 1 }],
        pause: 'essential',
        reason: 'The pulse shows that an upload is still running.',
      }),
    ).toMatchObject({ pause: 'essential', reason: 'The pulse shows that an upload is still running.' });
  });

  it('requires pause on a loop, at /spec/pause', () => {
    expect(() => validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }] } as never)).toThrow('/spec/pause: required');
  });

  it('requires a reason for an essential loop, at /spec/reason', () => {
    expect(() => validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'essential' } as never)).toThrow('/spec/reason: required');
  });

  it('refuses a reason on a control loop at /spec/reason, an empty reason and a pause outside its domain', () => {
    expect(() =>
      validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', reason: 'Not needed.' } as never),
    ).toThrow('/spec/reason: conflict');
    expect(() =>
      validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'essential', reason: '   ' } as never),
    ).toThrow('/spec/reason: empty');
    expect(() => validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'sometimes' } as never)).toThrow(
      '/spec/pause: invalid_value',
    );
  });

  it('refuses a spring timing on a loop, and pause on a reveal', () => {
    expect(() =>
      validateMotionSpec({ verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', timing: 'spring.default.spatial' } as never),
    ).toThrow('/spec/timing: unsupported');
    expect(() => validateMotionSpec({ verb: 'reveal', keyframes: [{ opacity: 0 }], pause: 'control' } as never)).toThrow(
      '/spec/pause: unsupported',
    );
  });

  it('classifies reveal and scrub as view motions, loop as a loop motion', () => {
    expect(kindOf('appear')).toBe('presence');
    expect(kindOf('emphasize')).toBe('emphasis');
    expect(kindOf('layout')).toBe('layout');
    expect(kindOf('reveal')).toBe('view');
    expect(kindOf('scrub')).toBe('view');
    expect(kindOf('loop')).toBe('loop');
  });
});

describe('a motion without a verb', () => {
  it('is accepted and frozen, its keyframes kept as a list', () => {
    const ref = defineMotion('lift-verbless', { keyframes: { scale: 1.04 } });
    expect(ref.spec).toEqual({ keyframes: [{ scale: 1.04 }] });
    expect(Object.isFrozen(ref)).toBe(true);
    expect(Object.isFrozen(ref.spec)).toBe(true);
    expect(Object.isFrozen(ref.spec.keyframes)).toBe(true);
  });

  it('throws a TypeError in development on each invalid spec, at the path of its issue', () => {
    const invalid: [unknown, string][] = [
      [{}, '/spec/keyframes: required'],
      [{ keyframes: [] }, '/spec/keyframes: empty'],
      [{ keyframes: [{}] }, '/spec/keyframes/0: empty'],
      [{ keyframes: { opacity: 0 }, stagger: 'normal' }, '/spec/stagger: unknown_field'],
      [{ keyframes: { opacity: 0 }, delay: -1 }, '/spec/delay: invalid_value'],
      [{ keyframes: { opacity: 0 }, timing: 'spring.nope' }, '/spec/timing: invalid_value'],
      [{ keyframes: { opacity: 0, offset: 0.5 } }, '/spec/keyframes/offset: unsupported'],
    ];
    for (const [spec, issue] of invalid) {
      expect(() => defineMotion('verbless-invalid', spec as never)).toThrow(TypeError);
      expect(() => defineMotion('verbless-invalid', spec as never)).toThrow(issue);
    }
  });
});

describe('a spec with a verb', () => {
  it('is validated by the old validator, which refuses what the old model refuses', () => {
    expect(
      defineMotion('legacy-stagger', { verb: 'appear', keyframes: [{ opacity: 1 }], stagger: 'normal' }).spec,
    ).toMatchObject({ stagger: 'normal' });
    expect(() =>
      defineMotion('legacy-interrupt', { verb: 'appear', keyframes: [{ opacity: 1 }], interrupt: 'carry' } as never),
    ).toThrow('/spec/interrupt: unsupported');
  });
});

describe('reserved trigger words', () => {
  it.each([
    'entering',
    'present',
    'exiting',
    'presence',
    'emphasis',
    'layout',
    'view',
    'loop',
    'hover',
    'focus',
    'scroll',
    'pointer',
    'change',
    'none',
  ])('refuses %s as a motion name', (name) => {
    expect(() => defineMotion(name, { keyframes: { opacity: 0 } })).toThrow(`"${name}" is reserved`);
  });

  it('still defines press, which is reserved only at step 5/8', () => {
    expect(defineMotion('press', { verb: 'emphasize', keyframes: [{ scale: 1 }, { scale: 0.96 }, { scale: 1 }] })).toBe(press);
  });
});

describe('inline specs and the presets without a verb', () => {
  it('keeps an inline spec out of the definitions', () => {
    const before = definedMotions();
    readMotion({ keyframes: { opacity: 0, y: 3 } });
    readMotion({ keyframes: { opacity: 0, y: 3 } });
    expect(definedMotions()).toEqual(before);
  });

  it('defines grow and dip as motions without a verb', () => {
    expect(resolveMotion('grow')).toBe(grow);
    expect(resolveMotion('dip')).toBe(dip);
    expect(grow.spec).toEqual({ keyframes: [{ opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }] });
    expect(dip.spec).toEqual({ keyframes: [{ scale: 0.96 }] });
  });
});

describe('reserved words: motion names, shared identities and sequences', () => {
  /** The words of the motion list: `defineMotion` refuses them, and no other definition does. */
  const MOTION_LIST = [
    'entering',
    'present',
    'exiting',
    'presence',
    'emphasis',
    'layout',
    'view',
    'loop',
    'hover',
    'focus',
    'scroll',
    'pointer',
    'change',
    'none',
  ];

  it.each(MOTION_LIST)(
    'lets a shared identity be named %s: only the motion list reserves that word',
    (word) => {
      expect(defineShared(word)).toBe(word);
    },
  );

  it.each(MOTION_LIST)(
    'lets a sequence be named %s: a sequence name is checked by assertName alone',
    (word) => {
      const steps = { steps: { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } } };
      expect(defineSequence(word, steps).name).toBe(word);
    },
  );

  it.each(['enter', 'exit', 'in', 'out', 'transition', 'animate', 'initial'])(
    'still refuses %s as a shared identity and as a motion name',
    (word) => {
      expect(() => defineShared(word)).toThrow(`"${word}" is reserved`);
      expect(() => defineMotion(word, { keyframes: { opacity: 0 } })).toThrow(`"${word}" is reserved`);
    },
  );

  it('names the motion list in the refusal of a motion name, and leaves assertName to the eight words', () => {
    expect(() => assertMotionName('hover')).toThrow('Motion name "hover" is reserved');
    expect(() => assertName('hover')).not.toThrow();
  });
});

describe('the checks of a motion without a verb', () => {
  it('refuses draw, along and offset in a keyframe, and a translate or a scale written with its axes', () => {
    const refused: [unknown, string][] = [
      [{ keyframes: { opacity: 0, draw: 1 } }, '/spec/keyframes/draw: unsupported'],
      [{ keyframes: [{ opacity: 0 }, { along: 1 }] }, '/spec/keyframes/1/along: unsupported'],
      [{ keyframes: { opacity: 0, offset: 0.5 } }, '/spec/keyframes/offset: unsupported'],
      [{ keyframes: { translate: '0px 0px', x: 3 } }, '/spec/keyframes: conflict'],
      [{ keyframes: [{ opacity: 0 }, { scale: 2, scaleX: 3 }] }, '/spec/keyframes/1: conflict'],
    ];
    for (const [spec, issue] of refused) {
      expect(() => defineMotion('verbless-refused', spec as never)).toThrow(issue);
    }
  });
});
