import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { motionManifest, timingIssues, validateMotionDocument } from './manifest.js';

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

  it('takes one timing grammar: a curve gives its duration as a token or in milliseconds, its easing as a token or in CSS', () => {
    for (const timing of [
      { duration: 3000, easing: 'easing.linear' },
      { duration: 'duration.long2', easing: 'cubic-bezier(0.3, 0, 0, 1)' },
      { duration: 450, easing: 'ease-out' },
    ]) {
      expect(errors({ version: 1, spec: { verb: 'appear', keyframes: [{ opacity: 1 }], timing } })).toEqual([]);
      expect(errors(loop({ pause: 'control', timing }))).toEqual([]);
    }
    expect(errors(loop({ pause: 'control', timing: { duration: 0, easing: 'easing.linear' } }))).toEqual([['/spec/timing/duration', 'invalid_value']]);
    expect(errors(loop({ pause: 'control', timing: { duration: -1, easing: 'easing.linear' } }))).toEqual([['/spec/timing/duration', 'invalid_value']]);
    expect(errors(loop({ pause: 'control', timing: { duration: '3000', easing: 'easing.linear' } }))).toEqual([['/spec/timing/duration', 'invalid_value']]);
    expect(errors(loop({ pause: 'control', timing: { duration: true, easing: 'easing.linear' } }))).toEqual([['/spec/timing/duration', 'type']]);
    expect(errors(loop({ pause: 'control', timing: { duration: 3000, easing: '' } }))).toEqual([['/spec/timing/easing', 'invalid_value']]);
    expect(errors(loop({ pause: 'control', timing: { duration: 3000, easing: 'easing.bounce' } }))).toEqual([['/spec/timing/easing', 'invalid_value']]);
    expect(errors(loop({ pause: 'control', timing: { duration: 3000, easing: 1 } }))).toEqual([['/spec/timing/easing', 'type']]);
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

  it('requires keyframes on every verb but layout, which takes none: it may omit them or give an empty list', () => {
    expect(motionManifest.spec.keyframelessVerbs).toEqual(['layout']);
    const json = JSON.parse(readFileSync(new URL('../motion-manifest.json', import.meta.url), 'utf8'));
    expect(json.spec.keyframelessVerbs).toEqual(['layout']);
    expect(json.verbs.layout.keyframes).toBe('none');
    expect(json.verbs.appear.keyframes).toBe('required');
    expect(errors({ version: 1, spec: { verb: 'layout' } })).toEqual([]);
    expect(errors({ version: 1, spec: { verb: 'layout', keyframes: [] } })).toEqual([]);
    expect(errors({ version: 1, spec: { verb: 'layout', keyframes: [{ x: 1 }] } })).toEqual([
      ['/spec/keyframes', 'unsupported'],
    ]);
    expect(errors({ version: 1, spec: { verb: 'appear' } })).toEqual([['/spec/keyframes', 'required']]);
  });

  it('states the timing grammar once, and the forms each API takes by nature', () => {
    const json = JSON.parse(readFileSync(new URL('../motion-manifest.json', import.meta.url), 'utf8'));
    expect(json.timing.forms).toEqual({
      spring: { token: 'springs' },
      curve: { duration: { token: 'durations', milliseconds: { exclusiveMinimum: 0 } }, easing: { token: 'easings', css: 'easing-function' } },
    });
    expect(json.timing.accepts).toEqual({
      appear: ['spring', 'curve'],
      disappear: ['spring', 'curve'],
      emphasize: ['spring', 'curve'],
      reveal: ['spring', 'curve'],
      scrub: [],
      loop: ['curve'],
      layout: ['spring', 'curve'],
      animateStyle: ['spring', 'curve'],
      morph: ['spring', 'curve'],
      sequenceStep: ['spring', 'curve'],
      createSpring: ['spring'],
      gesture: ['spring'],
      value: ['spring', 'none'],
    });
    // The verbs' rows agree with the verb table the option tables read.
    const label = (forms: string[]) => (forms.length === 0 ? 'none' : forms.length === 1 ? forms[0] : 'spring-or-curve');
    for (const verb of motionManifest.domains.supportedVerbs) expect(json.verbs[verb].timing).toBe(label(json.timing.accepts[verb]));
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

describe('reduced in the validator', () => {
  const reducedValues = motionManifest.spec.reducedValues as Record<string, readonly string[]>;
  const defaults = motionManifest.defaults as Record<string, { reduced: string }>;

  it('lists the reduced renders of the verbs that take one, and no others', () => {
    expect(reducedValues).toEqual({
      appear: ['fade', 'instant'],
      disappear: ['fade', 'instant'],
      emphasize: ['static', 'fade'],
      reveal: ['instant', 'fade'],
    });
  });

  it('refuses reduced at /spec/reduced on a scrub, a loop and a layout, which render as their default under reduced motion', () => {
    expect(errors({ version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], reduced: 'neutral' } })).toEqual([['/spec/reduced', 'unsupported']]);
    expect(errors({ version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', reduced: 'frozen' } })).toEqual([['/spec/reduced', 'unsupported']]);
    expect(errors({ version: 1, spec: { verb: 'layout', reduced: 'instant' } })).toEqual([['/spec/reduced', 'unsupported']]);
  });

  it('accepts each render of a verb, and refuses the renders of the others at /spec/reduced', () => {
    for (const [verb, values] of Object.entries(reducedValues)) {
      for (const reduced of values) expect(errors({ version: 1, spec: { verb, keyframes: [{ opacity: 1 }], reduced } })).toEqual([]);
      for (const reduced of motionManifest.domains.reduced.filter(value => !values.includes(value)))
        expect(errors({ version: 1, spec: { verb, keyframes: [{ opacity: 1 }], reduced } })).toEqual([['/spec/reduced', 'invalid_value']]);
    }
  });

  it('gives each verb that takes reduced a default among its own renders', () => {
    for (const [verb, values] of Object.entries(reducedValues)) expect(values).toContain(defaults[verb]?.reduced);
  });
});

describe('timingIssues', () => {
  const curve = { duration: 300, easing: 'easing.standard' };
  it('checks a timing against the grammar and the forms an API takes, with paths relative to the timing', () => {
    expect(timingIssues('spring.fast.spatial', ['spring', 'curve'])).toEqual([]);
    expect(timingIssues(curve, ['spring', 'curve'])).toEqual([]);
    expect(timingIssues('none', ['spring', 'none'])).toEqual([]);
    expect(timingIssues('none', ['spring'])).toEqual([{ path: '', code: 'invalid_value' }]);
    expect(timingIssues('spring.fast.spatial', ['curve'])).toEqual([{ path: '', code: 'unsupported' }]);
    expect(timingIssues(curve, ['spring', 'none'])).toEqual([{ path: '', code: 'unsupported' }]);
    expect(timingIssues(curve, [])).toEqual([{ path: '', code: 'unsupported' }]);
    expect(timingIssues(3, ['spring', 'curve'])).toEqual([{ path: '', code: 'type' }]);
    expect(timingIssues({ duration: 300 }, ['curve'])).toEqual([{ path: '/easing', code: 'required' }]);
    expect(timingIssues({ ...curve, delay: 2 }, ['curve'])).toEqual([{ path: '/delay', code: 'unknown_field' }]);
  });
});
