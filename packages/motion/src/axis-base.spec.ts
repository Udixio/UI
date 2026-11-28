import { describe, expect, it } from 'vitest';
import { NEUTRAL_AXIS_BASE, parseAxisBase } from './axis-base.js';

describe('parseAxisBase', () => {
  it('reads none, one, two and three values', () => {
    expect(parseAxisBase('none', 'none')).toEqual(NEUTRAL_AXIS_BASE);
    expect(parseAxisBase('10px', '2')).toEqual({
      x: '10px',
      y: '0px',
      scaleX: 2,
      scaleY: 2,
    });
    expect(parseAxisBase('-50% 12px', '1 0.5')).toEqual({
      x: '-50%',
      y: '12px',
      scaleX: 1,
      scaleY: 0.5,
    });
    expect(parseAxisBase('1px 2px 3px', '1 2 3')).toEqual({
      x: '1px',
      y: '2px',
      z: '3px',
      scaleX: 1,
      scaleY: 2,
      scaleZ: 3,
    });
  });
});
