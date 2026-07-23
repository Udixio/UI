import { describe, expect, it } from 'vitest';
import { getCardKeyActivation } from './card.behavior';

describe('getCardKeyActivation', () => {
  it('activates on Enter key down only', () => {
    expect(getCardKeyActivation({ key: 'Enter', phase: 'down' })).toEqual({
      activate: true,
      preventScroll: false,
    });
    expect(getCardKeyActivation({ key: 'Enter', phase: 'up' })).toEqual({
      activate: false,
      preventScroll: false,
    });
  });

  it('suppresses scroll on Space key down and activates on key up', () => {
    expect(getCardKeyActivation({ key: ' ', phase: 'down' })).toEqual({
      activate: false,
      preventScroll: true,
    });
    expect(getCardKeyActivation({ key: ' ', phase: 'up' })).toEqual({
      activate: true,
      preventScroll: false,
    });
  });

  it('ignores every other key', () => {
    for (const key of ['Tab', 'Escape', 'a', 'ArrowDown']) {
      for (const phase of ['down', 'up'] as const) {
        expect(getCardKeyActivation({ key, phase })).toEqual({
          activate: false,
          preventScroll: false,
        });
      }
    }
  });
});
