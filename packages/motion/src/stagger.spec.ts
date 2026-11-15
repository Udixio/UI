import { describe, expect, it } from 'vitest';
import { staggerDelay, visualRanks } from './stagger.js';

const box = (top: number, left: number, height = 20) => ({ top, left, height });

describe('visualRanks', () => {
  it('ranks a column from its top box', () => {
    expect(visualRanks([box(0, 0), box(20, 0), box(40, 0)], 'first')).toEqual([0, 1, 2]);
  });

  it('ranks a column given bottom first by its visual position', () => {
    expect(visualRanks([box(40, 0), box(20, 0), box(0, 0)], 'first')).toEqual([2, 1, 0]);
  });

  it('ranks a 3 by 2 grid row by row, then left to right, whatever the input order', () => {
    const shuffled = [
      box(30, 100),
      box(0, 200),
      box(30, 0),
      box(0, 0),
      box(30, 200),
      box(0, 100),
    ];
    expect(visualRanks(shuffled, 'first')).toEqual([4, 2, 3, 0, 5, 1]);
  });

  it('puts boxes whose tops differ by less than half their height in one row', () => {
    expect(visualRanks([box(9, 0), box(0, 100)], 'first')).toEqual([0, 1]);
  });

  it('counts from the last box with origin last', () => {
    const column = [box(0, 0), box(20, 0), box(40, 0), box(60, 0), box(80, 0)];
    expect(visualRanks(column, 'last')).toEqual([4, 3, 2, 1, 0]);
  });

  it('counts from the middle outwards with origin center', () => {
    const column = [box(0, 0), box(20, 0), box(40, 0), box(60, 0), box(80, 0)];
    expect(visualRanks(column, 'center')).toEqual([2, 1, 0, 1, 2]);
  });
});

describe('staggerDelay', () => {
  it('multiplies the rank by the step', () => {
    expect(staggerDelay(0, 50, 400)).toBe(0);
    expect(staggerDelay(3, 50, 400)).toBe(150);
  });

  it('caps the delay of a late rank', () => {
    expect(staggerDelay(10, 50, 400)).toBe(400);
  });
});
