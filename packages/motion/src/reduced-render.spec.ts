import { describe, expect, it } from 'vitest';
import { resolveReducedRender } from './reduced-render.js';

describe('resolveReducedRender', () => {
  it.each([
    ['appear', 'fade', false],
    ['disappear', 'fade', false],
    ['emphasize', 'static', true],
    ['reveal', 'instant', true],
    ['scrub', 'neutral', true],
    ['loop', 'frozen', true],
    ['layout', 'instant', true],
  ] as const)('resolves %s to %s', (verb, render, scalesWithMotion) => {
    expect(resolveReducedRender(verb)).toEqual({ render, scalesWithMotion });
  });

  it('uses a valid explicit override and never scales a fade', () => {
    expect(resolveReducedRender('disappear', 'instant')).toEqual({
      render: 'instant',
      scalesWithMotion: true,
    });
    expect(resolveReducedRender('disappear', 'fade')).toEqual({
      render: 'fade',
      scalesWithMotion: false,
    });
    expect(resolveReducedRender('emphasize', 'fade')).toEqual({
      render: 'fade',
      scalesWithMotion: false,
    });
  });

  it.each([
    ['appear', 'static'],
    ['emphasize', 'instant'],
    ['reveal', 'frozen'],
    ['scrub', 'neutral'],
    ['loop', 'frozen'],
    ['layout', 'instant'],
  ] as const)('refuses an override that %s does not render: %s', (verb, override) => {
    expect(() => resolveReducedRender(verb, override)).toThrow('Invalid reduced render');
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
