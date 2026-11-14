import { describe, expect, it, vi } from 'vitest';
import { defineTokens, resolveSpring } from './index.js';
import type { SpringRef, ResolvedSpring } from './index.js';

const refs = ['spring.fast.spatial', 'spring.fast.effects', 'spring.default.spatial', 'spring.default.effects', 'spring.slow.spatial', 'spring.slow.effects'] as const satisfies readonly SpringRef[];
const support = { linear: true, fallback: true };

describe('resolveSpring', () => {
  it.each(['expressive', 'standard'] as const)('selects complete %s token pairs for every support combination', (scheme) => {
    for (const ref of refs) {
      const [, speed, type] = ref.split('.') as ['spring', 'fast' | 'default' | 'slow', 'spatial' | 'effects'];
      const token = defineTokens({ scheme }).spring[speed][type];
      for (const linear of [false, true]) for (const fallback of [false, true]) {
        if (!linear && !fallback) expect(() => resolveSpring(ref, { scheme, support: { linear, fallback } })).toThrow();
        else {
          const source = linear ? 'linear' : 'fallback';
          expect(resolveSpring(ref, { scheme, support: { linear, fallback } })).toEqual({ ...token[source], source });
        }
      }
    }
  });
  it('defaults only an undefined scheme and returns independent results', () => {
    const result = resolveSpring('spring.fast.spatial', { support });
    expect(result.duration).toBe(360);
    expect(resolveSpring('spring.fast.spatial', { support: { linear: false, fallback: true } }).duration).toBe(350);
    expect(resolveSpring('spring.fast.spatial', { scheme: undefined, support })).toEqual(result);
    result.duration = 0; result.easing = 'bad';
    expect(resolveSpring('spring.fast.spatial', { support }).duration).toBe(360);
    expect(defineTokens().spring.fast.spatial.linear.duration).toBe(360);
    expect(resolveSpring('spring.fast.spatial', { scheme: 'standard', support }).duration).toBe(224);
    expect(resolveSpring('spring.fast.spatial', { scheme: 'standard', support: { linear: false, fallback: true } }).duration).toBe(350);
  });
  it('rejects invalid inputs without traversing prototypes', () => {
    const call = resolveSpring as unknown as (ref: unknown, options: unknown) => unknown;
    for (const ref of [undefined, null, {}, [], 1, '__proto__', 'constructor', 'spring.fast.spatial.extra', 'linear', 'spring.__proto__.spatial']) expect(() => call(ref, { support })).toThrow();
    for (const options of [undefined, null, 1, [], {}, { support: undefined }, { support: null }, { support: [] }, { support: 1 }, { support, scheme: null }, { support, scheme: 1 }, { support, scheme: 'other' }, { support: { linear: undefined, fallback: true } }, { support: { linear: null, fallback: true } }, { support: { linear: true, fallback: undefined } }, { support: { linear: true, fallback: null } }, { support: { linear: 1, fallback: true } }]) expect(() => call(refs[0], options)).toThrow();
  });
  it('works without DOM globals or trigonometry', () => {
    expect(typeof window).toBe('undefined');
    const sin = vi.spyOn(Math, 'sin'); const cos = vi.spyOn(Math, 'cos');
    try { resolveSpring(refs[0], { support }); expect(sin).not.toHaveBeenCalled(); expect(cos).not.toHaveBeenCalled(); }
    finally { sin.mockRestore(); cos.mockRestore(); }
  });
});

if (false) {
  // @ts-expect-error closed reference set
  resolveSpring('spring.fast.unknown', { support });
  // @ts-expect-error both support flags are required
  resolveSpring(refs[0], { support: { linear: true } });
  const source: ResolvedSpring['source'] = 'linear';
  // @ts-expect-error closed source union
  const invalid: ResolvedSpring['source'] = 'other';
  void source; void invalid;
}
