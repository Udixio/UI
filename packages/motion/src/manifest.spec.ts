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
        spec: { verb: 'appear', keyframes: [{ scaleX: 1, surprise: 1 }] },
      }),
    ).toEqual([
      ['/spec/keyframes/0/scaleX', 'unsupported'],
      ['/spec/keyframes/0/surprise', 'unknown_field'],
    ]);
    expect(motionManifest.deferredDomains.trigger.values).toEqual([
      'load',
      'view',
      'state',
    ]);
    expect(motionManifest.deferredDomains.pause.values).toEqual([
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
    expect(
      errors({ version: 1, spec: { verb: 'loop', keyframes: [] } }),
    ).toEqual([
      ['/spec/keyframes', 'empty'],
      ['/spec/verb', 'unsupported'],
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
