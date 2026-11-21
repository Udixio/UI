import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineGesture, validateGestureSpec, type GestureSpec } from './gesture.js';
import { onGestureDefined, resolveGesture } from './registries.js';

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  vi.restoreAllMocks();
});

describe('defineGesture', () => {
  it('returns a frozen reference with the defaults filled in, which resolveGesture returns unchanged', () => {
    const ref = defineGesture('gs-card', { type: 'drag', alternative: 'arrows' });
    expect(ref.name).toBe('gs-card');
    expect(Object.isFrozen(ref)).toBe(true);
    expect(resolveGesture('gs-card')).toBe(ref);
    expect(ref.spec).toEqual({ type: 'drag', axis: 'both', bounds: 'parent', timing: 'spring.default.spatial', alternative: 'arrows' });
    expect(Object.isFrozen(ref.spec)).toBe(true);
  });

  it('fills the axis of each type: both for drag, x for swipe, y for reorder', () => {
    expect(defineGesture('gs-swipe-default', { type: 'swipe', alternative: 'action' }).spec.axis).toBe('x');
    expect(defineGesture('gs-reorder-default', { type: 'reorder', alternative: 'grab' }).spec.axis).toBe('y');
  });

  it('gives bounds to drag only, and leaves them out of the other types', () => {
    expect(defineGesture('gs-swipe-plain', { type: 'swipe', alternative: 'action' }).spec).not.toHaveProperty('bounds');
    expect(defineGesture('gs-reorder-plain', { type: 'reorder', alternative: 'grab' }).spec).not.toHaveProperty('bounds');
    expect(defineGesture('gs-drag-free', { type: 'drag', bounds: 'none', alternative: 'arrows' }).spec).toHaveProperty('bounds', 'none');
  });

  it('rejects names that are not kebab-case', () => {
    for (const name of ['Card', 'card_x', '-card', 'card-', 'card--x', '']) {
      expect(() => defineGesture(name, { type: 'drag', alternative: 'arrows' })).toThrow(/must be kebab-case/);
    }
  });

  it('returns undefined for a name that is not defined', () => {
    expect(resolveGesture('gs-never-defined')).toBeUndefined();
  });

  it('requires a type of a known type, and refuses the former kind option', () => {
    expect(() => defineGesture('gs-no-kind', {} as never)).toThrow(/\/type: required/);
    expect(() => defineGesture('gs-bad-kind', { type: 'pinch', alternative: 'arrows' } as never)).toThrow(/\/type: invalid_value/);
    expect(() => defineGesture('gs-typed-kind', { type: 3, alternative: 'arrows' } as never)).toThrow(/\/type: type/);
    expect(() => defineGesture('gs-old-kind', { kind: 'drag' } as never)).toThrow('Invalid gesture spec: /kind: unknown_field; /type: required');
  });

  it('infers the keyboard alternative of its type when the spec leaves it out', () => {
    expect(defineGesture('gs-infer-drag', { type: 'drag' }).spec.alternative).toBe('arrows');
    expect(defineGesture('gs-infer-swipe', { type: 'swipe' }).spec.alternative).toBe('action');
    expect(defineGesture('gs-infer-reorder', { type: 'reorder' }).spec.alternative).toBe('grab');
    expect(JSON.stringify(defineGesture('gs-infer-order', { type: 'drag' }).spec)).toBe(
      '{"type":"drag","axis":"both","bounds":"parent","timing":"spring.default.spatial","alternative":"arrows"}',
    );
  });

  it('returns the same reference for a redefinition that names the inferred alternative, or leaves it out', () => {
    const first = defineGesture('gs-infer-same', { type: 'swipe' });
    expect(defineGesture('gs-infer-same', { type: 'swipe', alternative: 'action' })).toBe(first);
  });

  it('takes the keyboard alternative of its type when it names one, and refuses another one', () => {
    expect(defineGesture('gs-named-alternative', { type: 'drag', alternative: 'arrows' }).spec.alternative).toBe('arrows');
    expect(() => defineGesture('gs-swipe-arrows', { type: 'swipe', alternative: 'arrows' } as never)).toThrow(/\/alternative: invalid_value/);
    expect(() => defineGesture('gs-reorder-action', { type: 'reorder', alternative: 'action' } as never)).toThrow(/\/alternative: invalid_value/);
    expect(() => defineGesture('gs-drag-number', { type: 'drag', alternative: 3 } as never)).toThrow(/\/alternative: type/);
  });

  it('takes afterFlyOut for a swipe only, as hide or remove, and fills hide in', () => {
    expect(defineGesture('gs-fly-default', { type: 'swipe' }).spec).toHaveProperty('afterFlyOut', 'hide');
    expect(defineGesture('gs-fly-remove', { type: 'swipe', afterFlyOut: 'remove' }).spec).toHaveProperty('afterFlyOut', 'remove');
    expect(() => defineGesture('gs-fly-drag', { type: 'drag', afterFlyOut: 'remove' } as never)).toThrow(/\/afterFlyOut: unsupported/);
    expect(() => defineGesture('gs-fly-value', { type: 'swipe', afterFlyOut: 'vanish' } as never)).toThrow(/\/afterFlyOut: invalid_value/);
    expect(() => defineGesture('gs-fly-type', { type: 'swipe', afterFlyOut: true } as never)).toThrow(/\/afterFlyOut: type/);
  });

  it('takes an axis from the axes of its type', () => {
    expect(defineGesture('gs-drag-x', { type: 'drag', axis: 'x', alternative: 'arrows' }).spec.axis).toBe('x');
    expect(() => defineGesture('gs-swipe-both', { type: 'swipe', axis: 'both', alternative: 'action' } as never)).toThrow(/\/axis: invalid_value/);
    expect(() => defineGesture('gs-reorder-both', { type: 'reorder', axis: 'both', alternative: 'grab' } as never)).toThrow(/\/axis: invalid_value/);
    expect(() => defineGesture('gs-drag-block', { type: 'drag', axis: 'block', alternative: 'arrows' } as never)).toThrow(/\/axis: invalid_value/);
  });

  it('takes bounds for drag only, as parent or none', () => {
    expect(() => defineGesture('gs-swipe-bounds', { type: 'swipe', bounds: 'parent', alternative: 'action' } as never)).toThrow(/\/bounds: unsupported/);
    expect(() => defineGesture('gs-drag-window', { type: 'drag', bounds: 'window', alternative: 'arrows' } as never)).toThrow(/\/bounds: invalid_value/);
  });

  it('takes its timing as a spring only: it keeps the velocity of the release', () => {
    expect(defineGesture('gs-release', { type: 'swipe', timing: 'spring.fast.spatial', alternative: 'action' }).spec.timing).toBe(
      'spring.fast.spatial',
    );
    expect(() => defineGesture('gs-release-none', { type: 'swipe', timing: 'none', alternative: 'action' } as never)).toThrow(/\/timing: invalid_value/);
    expect(() => defineGesture('gs-release-bounce', { type: 'drag', timing: 'spring.bounce', alternative: 'arrows' } as never)).toThrow(
      /\/timing: invalid_value/,
    );
    expect(() => defineGesture('gs-release-curve', { type: 'drag', timing: { duration: 300, easing: 'linear' } } as never)).toThrow(/\/timing: unsupported/);
    expect(() => defineGesture('gs-release-old', { type: 'drag', release: 'spring.fast.spatial' } as never)).toThrow(/\/release: unknown_field/);
    const accepts: Record<string, string[]> = JSON.parse(readFileSync(new URL('../motion-manifest.json', import.meta.url), 'utf8')).timing.accepts;
    expect(accepts.gesture).toEqual(['spring']);
  });

  it('refuses unknown fields', () => {
    expect(() => defineGesture('gs-extra', { type: 'drag', alternative: 'arrows', color: 'red' } as never)).toThrow(/\/color: unknown_field/);
  });

  it('returns the same reference for an identical redefinition, the defaults included', () => {
    const first = defineGesture('gs-same', { type: 'reorder', alternative: 'grab' });
    expect(defineGesture('gs-same', { type: 'reorder', axis: 'y', timing: 'spring.default.spatial', alternative: 'grab' })).toBe(first);
  });

  it('throws naming the gesture when it is redefined with a different spec', () => {
    defineGesture('gs-other', { type: 'drag', alternative: 'arrows' });
    expect(() => defineGesture('gs-other', { type: 'swipe', alternative: 'action' })).toThrow(/gs-other/);
  });

  it('keeps the registry on globalThis under the shared symbol', () => {
    const ref = defineGesture('gs-shared', { type: 'swipe', alternative: 'action' });
    const registry = (globalThis as unknown as Record<symbol, Map<string, unknown>>)[Symbol.for('udixio.motion.gestures.preview.1')];
    expect(registry).toBeInstanceOf(Map);
    expect(registry?.get('gs-shared')).toBe(ref);
  });

  it('notifies listeners for each new definition until unsubscribed', () => {
    const seen: string[] = [];
    const unsubscribe = onGestureDefined(ref => seen.push(ref.name));
    defineGesture('gs-listened-one', { type: 'drag', alternative: 'arrows' });
    unsubscribe();
    defineGesture('gs-listened-two', { type: 'drag', alternative: 'arrows' });
    expect(seen).toEqual(['gs-listened-one']);
  });

  it('does not check the spec in production, and still names the gesture', () => {
    process.env.NODE_ENV = 'production';
    expect(() => defineGesture('gs-prod', { type: 'pinch', alternative: 'arrows' } as never)).not.toThrow();
    expect(() => defineGesture('Gs-Prod', { type: 'drag', alternative: 'arrows' })).toThrow(/must be kebab-case/);
  });
});

describe('validateGestureSpec', () => {
  it('returns a frozen copy in a fixed key order, with the defaults filled in', () => {
    const validated = validateGestureSpec({ alternative: 'arrows', type: 'drag' } satisfies GestureSpec);
    expect(JSON.stringify(validated)).toBe(
      '{"type":"drag","axis":"both","bounds":"parent","timing":"spring.default.spatial","alternative":"arrows"}',
    );
    expect(Object.isFrozen(validated)).toBe(true);
  });

  it('throws a TypeError naming every invalid path in development', () => {
    expect(() => validateGestureSpec({ type: 'swipe', alternative: 'arrows', bounds: 'parent', color: 'red' })).toThrow(TypeError);
    expect(() => validateGestureSpec({ type: 'swipe', alternative: 'arrows', bounds: 'parent', color: 'red' })).toThrow(
      'Invalid gesture spec: /alternative: invalid_value; /bounds: unsupported; /color: unknown_field',
    );
  });

  it('refuses a spec that is not an object', () => {
    expect(() => validateGestureSpec('drag')).toThrow('Invalid gesture spec: : type');
  });
});
