import { describe, expect, it } from 'vitest';
import { resolveReducedRender } from './reduced-render.js';

describe('resolveReducedRender', () => {
  it.each([
    ['appear', 'fade', true],
    ['disappear', 'fade', false],
    ['emphasize', 'static', true],
    ['reveal', 'instant', true],
    ['scrub', 'neutral', true],
    ['loop', 'frozen', true],
    ['layout', 'instant', true],
  ] as const)('resolves %s to %s', (verb, render, scalesWithMotion) => {
    expect(resolveReducedRender(verb)).toEqual({ render, scalesWithMotion });
  });

  it('uses a valid explicit override and preserves the disappear fade exception', () => {
    expect(resolveReducedRender('disappear', 'instant')).toEqual({
      render: 'instant',
      scalesWithMotion: true,
    });
    expect(resolveReducedRender('disappear', 'fade')).toEqual({
      render: 'fade',
      scalesWithMotion: false,
    });
    expect(resolveReducedRender('appear', 'static')).toEqual({
      render: 'static',
      scalesWithMotion: true,
    });
  });

  it.each([null, 0, '', 'toString', '__proto__', 'unknown'])(
    'rejects invalid verb %s',
    (verb) => {
      expect(() => resolveReducedRender(verb as never)).toThrow();
    },
  );

  it.each([null, 0, '', 'toString', 'unknown'])(
    'rejects invalid override %s',
    (override) => {
      expect(() => resolveReducedRender('appear', override as never)).toThrow();
    },
  );
});
