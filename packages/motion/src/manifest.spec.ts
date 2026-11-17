import { describe, expect, it } from 'vitest';
import { motionManifest, validateMotionDocument } from './manifest.js';

const valid = (verb = 'appear') => ({
  version: 1,
  spec: { verb, keyframes: [{ opacity: 1 }] },
});
const errors = (input: unknown) => {
  const result = validateMotionDocument(input);
  return result.valid
    ? []
    : result.errors.map(({ path, code }) => [path, code]);
};

describe('experimental motion manifest validator', () => {
  it('protects the public manifest from runtime mutation', () => {
    expect(() =>
      (motionManifest.domains.springs as unknown as string[]).push(
        'spring.fake',
      ),
    ).toThrow();
    expect(() => {
      (motionManifest.constraints as { minKeyframes: number }).minKeyframes = 0;
    }).toThrow();
    expect(
      errors({
        version: 1,
        spec: { verb: 'appear', keyframes: [], timing: 'spring.fake' },
      }),
    ).toEqual([
      ['/spec/keyframes', 'empty'],
      ['/spec/timing', 'invalid_value'],
    ]);
  });

  it('marks known future visual fields as unsupported and documents deferred domains', () => {
    expect(
      errors({
        version: 1,
        spec: { verb: 'appear', keyframes: [{ color: 1, surprise: 1 }] },
      }),
    ).toEqual([
      ['/spec/keyframes/0/color', 'unsupported'],
      ['/spec/keyframes/0/surprise', 'unknown_field'],
    ]);
    expect(motionManifest.deferredDomains).not.toHaveProperty('trigger');
    expect(motionManifest.domains.pause).toEqual([
      'control',
      'essential',
    ]);
  });
  it('accepts each supported verb and spring without injecting defaults', () => {
    for (const verb of ['appear', 'disappear', 'emphasize'])
      for (const timing of motionManifest.domains.springs) {
        const input = { version: 1, spec: { ...valid(verb).spec, timing } };
        const result = validateMotionDocument(
          JSON.parse(JSON.stringify(input)),
        );
        expect(result).toEqual({ valid: true, value: input });
      }
  });
  it('stops before inspecting spec for invalid versions', () => {
    for (const [version, code] of [
      [undefined, 'required'],
      ['1', 'type'],
      [1.5, 'invalid_value'],
      [Infinity, 'invalid_value'],
      [2, 'unsupported_version'],
    ] as const) {
      const input = {
        ...(version === undefined ? {} : { version }),
        get spec() {
          throw Error('inspected');
        },
        extra: 1,
      };
      expect(errors(input)).toEqual([
        ['/extra', 'unknown_field'],
        ['/version', code],
      ]);
    }
  });
  it('reports escaped own keys in lexical order and ignores inherited properties', () => {
    const input = JSON.parse(
      '{"version":1,"spec":{"verb":"appear","keyframes":[{}],"~a/b":1,"__proto__":1}}',
    );
    expect(errors(input)).toEqual([
      ['/spec/__proto__', 'unknown_field'],
      ['/spec/keyframes/0', 'empty'],
      ['/spec/~0a~1b', 'unknown_field'],
    ]);
    expect(errors(Object.assign(Object.create({ extra: 1 }), valid()))).toEqual(
      [],
    );
  });
  it('rejects unsupported and malformed values without mutating input', () => {
    const input = Object.freeze({
      version: 1,
      spec: Object.freeze({
        verb: 'appear',
        keyframes: Object.freeze([Object.freeze({ x: Infinity })]),
        interrupt: 'carry',
        timing: 'spring.fake',
        reduced: null,
      }),
    });
    expect(errors(input)).toEqual([
      ['/spec/interrupt', 'unsupported'],
      ['/spec/keyframes/0/x', 'invalid_value'],
      ['/spec/reduced', 'type'],
      ['/spec/timing', 'invalid_value'],
    ]);
    expect(errors(null)).toEqual([['', 'type']]);
    expect(
      errors({
        version: 1,
        spec: {
          verb: 'emphasize',
          keyframes: [{ x: 1 }],
          interrupt: 'restart',
        },
      }),
    ).toEqual([]);
  });
});

describe('split in the validator', () => {
  it('accepts a split of the letters, words or lines on appear, disappear and reveal', () => {
    for (const by of ['chars', 'words', 'lines']) {
      expect(errors({ version: 1, spec: { verb: 'appear', keyframes: [{ opacity: 1 }], split: by } })).toEqual([]);
      expect(errors({ version: 1, spec: { verb: 'disappear', keyframes: [{ opacity: 1 }], split: by } })).toEqual([]);
      expect(errors({ version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 1 }], split: by } })).toEqual([]);
    }
  });

  it('refuses a split on the verbs that do not take it, at /spec/split', () => {
    expect(errors({ version: 1, spec: { verb: 'emphasize', keyframes: [{ scale: 1 }], split: 'words' } })).toEqual([
      ['/spec/split', 'unsupported'],
    ]);
    expect(errors({ version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], split: 'words' } })).toEqual([
      ['/spec/split', 'unsupported'],
    ]);
    expect(
      errors({ version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', split: 'words' } }),
    ).toEqual([['/spec/split', 'unsupported']]);
    expect(errors({ version: 1, spec: { verb: 'layout', split: 'words' } })).toEqual([['/spec/split', 'unsupported']]);
  });

  it('refuses a split outside its domain, and documents the domain and the verbs', () => {
    expect(errors({ version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 1 }], split: 'sentences' } })).toEqual([
      ['/spec/split', 'invalid_value'],
    ]);
    expect(motionManifest.domains.split).toEqual(['chars', 'words', 'lines']);
    expect(motionManifest.spec.optional).toContain('split');
    expect(motionManifest.spec.splitVerbs).toEqual(['appear', 'disappear', 'reveal']);
  });
});

describe('reveal, scrub and loop in the validator', () => {
  const loop = (extra: Record<string, unknown>) => ({
    version: 1,
    spec: { verb: 'loop', keyframes: [{ opacity: 1 }], ...extra },
  });

  it('accepts a reveal with a spring or a curve, and a scrub with a range and an axis', () => {
    expect(
      errors({
        version: 1,
        spec: {
          verb: 'reveal',
          keyframes: [{ opacity: 0 }],
          timing: 'spring.default.spatial',
          repeat: 'always',
          axis: 'inline',
          stagger: 'loose',
          origin: 'center',
        },
      }),
    ).toEqual([]);
    expect(
      errors({
        version: 1,
        spec: {
          verb: 'reveal',
          keyframes: [{ opacity: 0 }],
          timing: { duration: 'duration.long2', easing: 'easing.standard' },
        },
      }),
    ).toEqual([]);
    expect(errors({ version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], range: 'contain', axis: 'block' } })).toEqual([]);
  });

  it('refuses a timing on a scrub, and a spring on a loop, both at /spec/timing', () => {
    expect(
      errors({ version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], timing: 'spring.default.spatial' } }),
    ).toEqual([['/spec/timing', 'unsupported']]);
    expect(
      errors({
        version: 1,
        spec: { verb: 'scrub', keyframes: [{ y: 1 }], timing: { duration: 'duration.long2', easing: 'easing.standard' } },
      }),
    ).toEqual([['/spec/timing', 'unsupported']]);
    expect(errors(loop({ pause: 'control', timing: 'spring.default.spatial' }))).toEqual([['/spec/timing', 'unsupported']]);
    expect(
      errors(loop({ pause: 'control', timing: { duration: 'duration.extraLong4', easing: 'easing.linear' } })),
    ).toEqual([]);
  });

  it('checks the pause and reason matrix of a loop', () => {
    expect(errors(loop({ pause: 'control' }))).toEqual([]);
    expect(errors(loop({ pause: 'control', reason: 'Not needed.' }))).toEqual([['/spec/reason', 'conflict']]);
    expect(errors(loop({ pause: 'essential', reason: 'Shows that the feed is live.' }))).toEqual([]);
    expect(errors(loop({ pause: 'essential' }))).toEqual([['/spec/reason', 'required']]);
    expect(errors(loop({ pause: 'essential', reason: '' }))).toEqual([['/spec/reason', 'empty']]);
    expect(errors(loop({ pause: 'essential', reason: '  ' }))).toEqual([['/spec/reason', 'empty']]);
    expect(errors(loop({ pause: 'essential', reason: 3 }))).toEqual([['/spec/reason', 'type']]);
    expect(errors(loop({}))).toEqual([['/spec/pause', 'required']]);
    expect(errors(loop({ pause: 'sometimes' }))).toEqual([['/spec/pause', 'invalid_value']]);
  });

  it('refuses pause, range and repeat where their verb does not take them', () => {
    expect(errors({ version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 0 }], pause: 'control' } })).toEqual([
      ['/spec/pause', 'unsupported'],
    ]);
    expect(errors({ version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], pause: 'control' } })).toEqual([
      ['/spec/pause', 'unsupported'],
    ]);
    expect(errors({ version: 1, spec: { verb: 'appear', keyframes: [{ opacity: 0 }], range: 'cross' } })).toEqual([
      ['/spec/range', 'unsupported'],
    ]);
    expect(errors(loop({ pause: 'control', repeat: 'once', axis: 'block' }))).toEqual([
      ['/spec/axis', 'unsupported'],
      ['/spec/repeat', 'unsupported'],
    ]);
  });

  it('reports the keyframes of a reveal, a scrub and a loop as required or empty', () => {
    expect(errors({ version: 1, spec: { verb: 'reveal' } })).toEqual([['/spec/keyframes', 'required']]);
    expect(errors({ version: 1, spec: { verb: 'scrub', keyframes: [] } })).toEqual([['/spec/keyframes', 'empty']]);
    expect(errors({ version: 1, spec: { verb: 'loop', pause: 'control' } })).toEqual([['/spec/keyframes', 'required']]);
  });

  it('reports an empty keyframes list and a missing pause on a loop, not an unsupported verb', () => {
    expect(errors({ version: 1, spec: { verb: 'loop', keyframes: [] } })).toEqual([
      ['/spec/keyframes', 'empty'],
      ['/spec/pause', 'required'],
    ]);
  });

  it('requires keyframes on every verb but layout, which may omit them or give an empty list', () => {
    expect(motionManifest.spec.keyframesOptionalVerbs).toEqual(['layout']);
    expect(errors({ version: 1, spec: { verb: 'layout' } })).toEqual([]);
    expect(errors({ version: 1, spec: { verb: 'layout', keyframes: [] } })).toEqual([]);
    expect(errors({ version: 1, spec: { verb: 'layout', keyframes: [{ x: 1 }] } })).toEqual([
      ['/spec/keyframes', 'unsupported'],
    ]);
    expect(errors({ version: 1, spec: { verb: 'appear' } })).toEqual([['/spec/keyframes', 'required']]);
  });

  it('documents the new verbs, domains and defaults in the manifest', () => {
    expect(motionManifest.domains.supportedVerbs).toEqual([
      'appear',
      'disappear',
      'emphasize',
      'reveal',
      'scrub',
      'loop',
      'layout',
    ]);
    expect(motionManifest.domains.repeat).toEqual(['once', 'always']);
    expect(motionManifest.domains.axis).toEqual(['block', 'inline']);
    expect(motionManifest.domains.range).toEqual(['enter', 'cross', 'exit', 'contain']);
    expect(motionManifest.domains.pause).toEqual(['control', 'essential']);
    expect(motionManifest.spec.deferred).toEqual(['direction', 'distance']);
    expect(motionManifest.defaults.loop.timing).toEqual([]);
    expect(motionManifest.defaults.loop.curve).toEqual({
      duration: 'duration.extraLong4',
      easing: 'easing.linear',
    });
  });
});
