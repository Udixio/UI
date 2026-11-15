import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineMotion, resolveMotion } from './define-motion.js';
import { defineValue, onValueDefined, resolveValue, validateValueSpec, type ValueSpec } from './value.js';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  vi.restoreAllMocks();
});

describe('defineValue', () => {
  it('returns a frozen reference with the defaults filled in, which resolveValue returns unchanged', () => {
    const ref = defineValue('tilt-card', { source: 'pointer' });
    expect(ref.name).toBe('tilt-card');
    expect(Object.isFrozen(ref)).toBe(true);
    expect(resolveValue('tilt-card')).toBe(ref);
    expect(ref.spec).toEqual({ source: 'pointer', axis: 'x', range: [0, 1], spring: 'spring.default.spatial' });
    expect(Object.isFrozen(ref.spec)).toBe(true);
    expect(Object.isFrozen(ref.spec.range)).toBe(true);
  });

  it('rejects names that are not kebab-case', () => {
    for (const name of ['Tilt', 'tilt_x', '-tilt', 'tilt-', 'tilt--x', '']) {
      expect(() => defineValue(name, { source: 'pointer' })).toThrow(/must be kebab-case/);
    }
  });

  it('returns undefined for a name that is not defined', () => {
    expect(resolveValue('never-defined-value')).toBeUndefined();
  });

  it('requires a source of a known kind', () => {
    expect(() => defineValue('no-source', {} as never)).toThrow(/\/source: required/);
    expect(() => defineValue('bad-source', { source: 'hover' } as never)).toThrow(/\/source: invalid_value/);
    expect(() => defineValue('typed-source', { source: 3 } as never)).toThrow(/\/source: type/);
  });

  it('takes an axis for pointer and scroll only, from that source’s axes', () => {
    expect(defineValue('pointer-y', { source: 'pointer', axis: 'y' }).spec.axis).toBe('y');
    expect(defineValue('scroll-inline', { source: 'scroll', axis: 'inline' }).spec.axis).toBe('inline');
    expect(() => defineValue('pointer-block', { source: 'pointer', axis: 'block' } as never)).toThrow(/\/axis: invalid_value/);
    expect(() => defineValue('scroll-x', { source: 'scroll', axis: 'x' } as never)).toThrow(/\/axis: invalid_value/);
    expect(() => defineValue('state-axis', { source: 'state', axis: 'x' } as never)).toThrow(/\/axis: unsupported/);
    expect(() => defineValue('time-axis', { source: 'time', axis: 'block' } as never)).toThrow(/\/axis: unsupported/);
  });

  it('validates range as two finite, different numbers, and allows it to run backwards', () => {
    expect(defineValue('backwards', { source: 'state', range: [100, 0] }).spec.range).toEqual([100, 0]);
    expect(() => defineValue('flat-range', { source: 'state', range: [5, 5] })).toThrow(/\/range: invalid_value/);
    expect(() => defineValue('nan-range', { source: 'state', range: [0, NaN] })).toThrow(/\/range: invalid_value/);
    expect(() => defineValue('inf-range', { source: 'state', range: [0, Infinity] })).toThrow(/\/range: invalid_value/);
    expect(() => defineValue('short-range', { source: 'state', range: [0] } as never)).toThrow(/\/range: invalid_value/);
    expect(() => defineValue('text-range', { source: 'state', range: ['0', 1] } as never)).toThrow(/\/range: type/);
  });

  it('takes a spring from the manifest, or none, and refuses one for time', () => {
    expect(defineValue('no-spring', { source: 'pointer', spring: 'none' }).spec.spring).toBe('none');
    expect(defineValue('effects-spring', { source: 'state', spring: 'spring.default.effects' }).spec.spring).toBe('spring.default.effects');
    expect(() => defineValue('bounce-spring', { source: 'state', spring: 'spring.bounce' } as never)).toThrow(/\/spring: invalid_value/);
    expect(() => defineValue('time-spring', { source: 'time', spring: 'spring.default.spatial' })).toThrow(/\/spring: unsupported/);
  });

  it('takes a timing only for time, and gives it the loop curve by default', () => {
    expect(defineValue('default-period', { source: 'time' }).spec.timing).toEqual({ duration: 'duration.extraLong4', easing: 'easing.linear' });
    expect(defineValue('short-period', { source: 'time', timing: { duration: 'duration.medium2', easing: 'easing.linear' } }).spec.timing).toEqual({
      duration: 'duration.medium2',
      easing: 'easing.linear',
    });
    expect(() => defineValue('state-timing', { source: 'state', timing: { duration: 'duration.medium2', easing: 'easing.linear' } })).toThrow(/\/timing: unsupported/);
    expect(() => defineValue('huge-period', { source: 'time', timing: { duration: 'duration.huge', easing: 'easing.linear' } } as never)).toThrow(/\/timing\/duration: invalid_value/);
  });

  it('refuses unknown fields', () => {
    expect(() => defineValue('extra-field', { source: 'pointer', color: 'red' } as never)).toThrow(/\/color: unknown_field/);
  });

  it('returns the same reference for an identical redefinition, the defaults included', () => {
    const first = defineValue('same-tilt', { source: 'pointer' });
    expect(defineValue('same-tilt', { source: 'pointer', axis: 'x', range: [0, 1], spring: 'spring.default.spatial' })).toBe(first);
  });

  it('throws naming the value when it is redefined with a different spec', () => {
    defineValue('other-tilt', { source: 'pointer' });
    expect(() => defineValue('other-tilt', { source: 'scroll' })).toThrow(/other-tilt/);
  });

  it('keeps the registry on globalThis under the shared symbol', () => {
    const ref = defineValue('shared-reading', { source: 'scroll' });
    const registry = (globalThis as unknown as Record<symbol, Map<string, unknown>>)[
      Symbol.for('udixio.motion.values.preview.1')
    ];
    expect(registry).toBeInstanceOf(Map);
    expect(registry?.get('shared-reading')).toBe(ref);
  });

  it('keeps values and motions apart, so that one name can be both', () => {
    const motion = defineMotion('value-and-motion', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
    const value = defineValue('value-and-motion', { source: 'state' });
    expect(resolveMotion('value-and-motion')).toBe(motion);
    expect(resolveValue('value-and-motion')).toBe(value);
  });

  it('notifies listeners for each new definition until unsubscribed', () => {
    const seen: string[] = [];
    const unsubscribe = onValueDefined(ref => seen.push(ref.name));
    defineValue('listened-one', { source: 'state' });
    unsubscribe();
    defineValue('listened-two', { source: 'state' });
    expect(seen).toEqual(['listened-one']);
  });

  it('keeps the definition and calls the other listeners when a listener throws', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const called: string[] = [];
    const unsubscribeThrowing = onValueDefined(() => {
      throw new Error('listener failure');
    });
    const unsubscribeSecond = onValueDefined(ref => called.push(ref.name));
    const ref = defineValue('isolated-value', { source: 'state' });
    unsubscribeThrowing();
    unsubscribeSecond();
    expect(resolveValue('isolated-value')).toBe(ref);
    expect(called).toEqual(['isolated-value']);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('does not check the spec in production, and still names the value', () => {
    process.env.NODE_ENV = 'production';
    expect(() => defineValue('prod-value', { source: 'hover' } as never)).not.toThrow();
    expect(() => defineValue('Prod-Name', { source: 'state' })).toThrow(/must be kebab-case/);
  });
});

describe('formatted values', () => {
  it('takes a format for state only', () => {
    expect(defineValue('fmt-state', { source: 'state', format: 'integer' }).spec.format).toBe('integer');
    expect(() => defineValue('fmt-pointer', { source: 'pointer', format: 'integer' } as never)).toThrow(/\/format: unsupported/);
    expect(() => defineValue('fmt-scroll', { source: 'scroll', format: 'percent' } as never)).toThrow(/\/format: unsupported/);
    expect(() => defineValue('fmt-time', { source: 'time', format: 'integer' } as never)).toThrow(/\/format: unsupported/);
  });

  it('refuses a format that is not one of the four, and a format that is not a string', () => {
    expect(() => defineValue('fmt-unknown', { source: 'state', format: 'roman' } as never)).toThrow(/\/format: invalid_value/);
    expect(() => defineValue('fmt-typed', { source: 'state', format: 1 } as never)).toThrow(/\/format: type/);
  });

  it('takes a currency with the currency format, and requires one with it', () => {
    expect(defineValue('cur-eur', { source: 'state', format: 'currency', currency: 'EUR' }).spec.currency).toBe('EUR');
    expect(() => defineValue('cur-missing', { source: 'state', format: 'currency' })).toThrow(/\/currency: required/);
    expect(() => defineValue('cur-refused', { source: 'state', format: 'integer', currency: 'EUR' } as never)).toThrow(/\/currency: unsupported/);
    expect(() => defineValue('cur-bare', { source: 'state', currency: 'EUR' } as never)).toThrow(/\/currency: unsupported/);
  });

  it('refuses a currency that is not three capital letters', () => {
    for (const [index, currency] of ['euro', 'eu', 'EURO', 'E1R', 'eur'].entries()) {
      expect(() => defineValue(`cur-bad-${index}`, { source: 'state', format: 'currency', currency })).toThrow(/\/currency: invalid_value/);
    }
  });

  it('gives a formatted value the critically damped spring unless its spec names one', () => {
    expect(defineValue('fmt-spring-default', { source: 'state', format: 'integer' }).spec.spring).toBe('spring.default.effects');
    expect(defineValue('fmt-spring-spatial', { source: 'state', format: 'integer', spring: 'spring.default.spatial' }).spec.spring).toBe(
      'spring.default.spatial',
    );
    expect(defineValue('fmt-spring-none', { source: 'state', format: 'integer', spring: 'none' }).spec.spring).toBe('none');
  });
});

describe('validateValueSpec', () => {
  it('returns a frozen copy in a fixed key order, without the fields a source does not take', () => {
    const validated = validateValueSpec({ range: [0, 10], source: 'state' } satisfies ValueSpec);
    expect(JSON.stringify(validated)).toBe('{"source":"state","range":[0,10],"spring":"spring.default.spatial"}');
    expect(Object.isFrozen(validated)).toBe(true);
  });

  it('gives a time value no spring, and the default range and loop curve', () => {
    expect(JSON.stringify(validateValueSpec({ source: 'time' }))).toBe(
      '{"source":"time","range":[0,1],"timing":{"duration":"duration.extraLong4","easing":"easing.linear"}}',
    );
  });

  it('throws a TypeError naming every invalid path in development', () => {
    expect(() => validateValueSpec({ source: 'state', axis: 'x', spring: 'none', color: 'red' })).toThrow(TypeError);
    expect(() => validateValueSpec({ source: 'state', axis: 'x', spring: 'none', color: 'red' })).toThrow(
      'Invalid value spec: /axis: unsupported; /color: unknown_field',
    );
  });
});
