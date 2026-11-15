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
    const ref = defineGesture('gs-card', { kind: 'drag', alternative: 'arrows' });
    expect(ref.name).toBe('gs-card');
    expect(Object.isFrozen(ref)).toBe(true);
    expect(resolveGesture('gs-card')).toBe(ref);
    expect(ref.spec).toEqual({ kind: 'drag', axis: 'both', bounds: 'parent', release: 'spring.default.spatial', alternative: 'arrows' });
    expect(Object.isFrozen(ref.spec)).toBe(true);
  });

  it('fills the axis of each kind: both for drag, x for swipe, y for reorder', () => {
    expect(defineGesture('gs-swipe-default', { kind: 'swipe', alternative: 'action' }).spec.axis).toBe('x');
    expect(defineGesture('gs-reorder-default', { kind: 'reorder', alternative: 'grab' }).spec.axis).toBe('y');
  });

  it('gives bounds to drag only, and leaves them out of the other kinds', () => {
    expect(defineGesture('gs-swipe-plain', { kind: 'swipe', alternative: 'action' }).spec).not.toHaveProperty('bounds');
    expect(defineGesture('gs-reorder-plain', { kind: 'reorder', alternative: 'grab' }).spec).not.toHaveProperty('bounds');
    expect(defineGesture('gs-drag-free', { kind: 'drag', bounds: 'none', alternative: 'arrows' }).spec).toHaveProperty('bounds', 'none');
  });

  it('rejects names that are not kebab-case', () => {
    for (const name of ['Card', 'card_x', '-card', 'card-', 'card--x', '']) {
      expect(() => defineGesture(name, { kind: 'drag', alternative: 'arrows' })).toThrow(/must be kebab-case/);
    }
  });

  it('returns undefined for a name that is not defined', () => {
    expect(resolveGesture('gs-never-defined')).toBeUndefined();
  });

  it('requires a kind of a known kind', () => {
    expect(() => defineGesture('gs-no-kind', {} as never)).toThrow(/\/kind: required/);
    expect(() => defineGesture('gs-bad-kind', { kind: 'pinch', alternative: 'arrows' } as never)).toThrow(/\/kind: invalid_value/);
    expect(() => defineGesture('gs-typed-kind', { kind: 3, alternative: 'arrows' } as never)).toThrow(/\/kind: type/);
  });

  it('takes the keyboard alternative of its kind, and refuses another one', () => {
    expect(() => defineGesture('gs-no-alternative', { kind: 'drag' } as never)).toThrow(/\/alternative: required/);
    expect(() => defineGesture('gs-swipe-arrows', { kind: 'swipe', alternative: 'arrows' } as never)).toThrow(/\/alternative: invalid_value/);
    expect(() => defineGesture('gs-reorder-action', { kind: 'reorder', alternative: 'action' } as never)).toThrow(/\/alternative: invalid_value/);
  });

  it('takes an axis from the axes of its kind', () => {
    expect(defineGesture('gs-drag-x', { kind: 'drag', axis: 'x', alternative: 'arrows' }).spec.axis).toBe('x');
    expect(() => defineGesture('gs-swipe-both', { kind: 'swipe', axis: 'both', alternative: 'action' } as never)).toThrow(/\/axis: invalid_value/);
    expect(() => defineGesture('gs-reorder-both', { kind: 'reorder', axis: 'both', alternative: 'grab' } as never)).toThrow(/\/axis: invalid_value/);
    expect(() => defineGesture('gs-drag-block', { kind: 'drag', axis: 'block', alternative: 'arrows' } as never)).toThrow(/\/axis: invalid_value/);
  });

  it('takes bounds for drag only, as parent or none', () => {
    expect(() => defineGesture('gs-swipe-bounds', { kind: 'swipe', bounds: 'parent', alternative: 'action' } as never)).toThrow(/\/bounds: unsupported/);
    expect(() => defineGesture('gs-drag-window', { kind: 'drag', bounds: 'window', alternative: 'arrows' } as never)).toThrow(/\/bounds: invalid_value/);
  });

  it('takes a release spring from the manifest, and refuses none', () => {
    expect(defineGesture('gs-release', { kind: 'swipe', release: 'spring.fast.spatial', alternative: 'action' }).spec.release).toBe(
      'spring.fast.spatial',
    );
    expect(() => defineGesture('gs-release-none', { kind: 'swipe', release: 'none', alternative: 'action' } as never)).toThrow(/\/release: invalid_value/);
    expect(() => defineGesture('gs-release-bounce', { kind: 'drag', release: 'spring.bounce', alternative: 'arrows' } as never)).toThrow(
      /\/release: invalid_value/,
    );
  });

  it('refuses unknown fields', () => {
    expect(() => defineGesture('gs-extra', { kind: 'drag', alternative: 'arrows', color: 'red' } as never)).toThrow(/\/color: unknown_field/);
  });

  it('returns the same reference for an identical redefinition, the defaults included', () => {
    const first = defineGesture('gs-same', { kind: 'reorder', alternative: 'grab' });
    expect(defineGesture('gs-same', { kind: 'reorder', axis: 'y', release: 'spring.default.spatial', alternative: 'grab' })).toBe(first);
  });

  it('throws naming the gesture when it is redefined with a different spec', () => {
    defineGesture('gs-other', { kind: 'drag', alternative: 'arrows' });
    expect(() => defineGesture('gs-other', { kind: 'swipe', alternative: 'action' })).toThrow(/gs-other/);
  });

  it('keeps the registry on globalThis under the shared symbol', () => {
    const ref = defineGesture('gs-shared', { kind: 'swipe', alternative: 'action' });
    const registry = (globalThis as unknown as Record<symbol, Map<string, unknown>>)[Symbol.for('udixio.motion.gestures.preview.1')];
    expect(registry).toBeInstanceOf(Map);
    expect(registry?.get('gs-shared')).toBe(ref);
  });

  it('notifies listeners for each new definition until unsubscribed', () => {
    const seen: string[] = [];
    const unsubscribe = onGestureDefined(ref => seen.push(ref.name));
    defineGesture('gs-listened-one', { kind: 'drag', alternative: 'arrows' });
    unsubscribe();
    defineGesture('gs-listened-two', { kind: 'drag', alternative: 'arrows' });
    expect(seen).toEqual(['gs-listened-one']);
  });

  it('does not check the spec in production, and still names the gesture', () => {
    process.env.NODE_ENV = 'production';
    expect(() => defineGesture('gs-prod', { kind: 'pinch', alternative: 'arrows' } as never)).not.toThrow();
    expect(() => defineGesture('Gs-Prod', { kind: 'drag', alternative: 'arrows' })).toThrow(/must be kebab-case/);
  });
});

describe('validateGestureSpec', () => {
  it('returns a frozen copy in a fixed key order, with the defaults filled in', () => {
    const validated = validateGestureSpec({ alternative: 'arrows', kind: 'drag' } satisfies GestureSpec);
    expect(JSON.stringify(validated)).toBe(
      '{"kind":"drag","axis":"both","bounds":"parent","release":"spring.default.spatial","alternative":"arrows"}',
    );
    expect(Object.isFrozen(validated)).toBe(true);
  });

  it('throws a TypeError naming every invalid path in development', () => {
    expect(() => validateGestureSpec({ kind: 'swipe', alternative: 'arrows', bounds: 'parent', color: 'red' })).toThrow(TypeError);
    expect(() => validateGestureSpec({ kind: 'swipe', alternative: 'arrows', bounds: 'parent', color: 'red' })).toThrow(
      'Invalid gesture spec: /alternative: invalid_value; /bounds: unsupported; /color: unknown_field',
    );
  });

  it('refuses a spec that is not an object', () => {
    expect(() => validateGestureSpec('drag')).toThrow('Invalid gesture spec: : type');
  });
});
