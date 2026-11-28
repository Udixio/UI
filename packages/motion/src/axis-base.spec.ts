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

  it('keeps a calc() value whole, its inner spaces included', () => {
    expect(parseAxisBase('calc(50% + 4px) 0', 'none')).toEqual({
      x: 'calc(50% + 4px)',
      y: '0',
      scaleX: 1,
      scaleY: 1,
    });
    expect(parseAxisBase('calc(-50% + 4px) calc(2px * 3) 1px', '1')).toEqual({
      x: 'calc(-50% + 4px)',
      y: 'calc(2px * 3)',
      z: '1px',
      scaleX: 1,
      scaleY: 1,
    });
  });
});
