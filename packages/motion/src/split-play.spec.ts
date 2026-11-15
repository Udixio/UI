import { describe, expect, it } from 'vitest';
import { textRanks } from './split-play.js';

describe('textRanks', () => {
  it('ranks the pieces of a text in text order from its first piece', () => {
    expect(textRanks(4, 'first')).toEqual([0, 1, 2, 3]);
  });

  it('counts from the last piece with origin last, and from the middle outwards with origin center', () => {
    expect(textRanks(4, 'last')).toEqual([3, 2, 1, 0]);
    expect(textRanks(5, 'center')).toEqual([2, 1, 0, 1, 2]);
    expect(textRanks(4, 'center')).toEqual([2, 1, 1, 2]);
  });

  it('ranks no piece for an empty text', () => {
    expect(textRanks(0, 'first')).toEqual([]);
  });
});
