import { describe, expect, it } from 'vitest';
import type { MotionElement } from './contract.js';
import { motion } from './bind.js';
import { contentKeyOf, readMotion } from './define-motion.js';
import { grow } from './presets.js';

describe('readMotion', () => {
  it('under a new entry, rise gives no stagger: its reading has the keys of a motion and no others', () => {
    const reading = readMotion('rise');
    expect(reading && Object.keys(reading).sort()).toEqual([
      'delay',
      'frames',
      'key',
      'name',
    ]);
  });

  it('parallax gives no range', () => {
    const reading = readMotion('parallax');
    expect(reading && Object.keys(reading).sort()).toEqual([
      'delay',
      'frames',
      'key',
      'name',
    ]);
    expect(reading).not.toHaveProperty('range');
  });

  it('reads the old words of reduced as the new ones', () => {
    expect(
      readMotion({
        verb: 'appear',
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        reduced: 'instant',
      })?.reduced,
    ).toBe('end');
    expect(
      readMotion({
        verb: 'emphasize',
        keyframes: [{ scale: 1 }],
        reduced: 'static',
      })?.reduced,
    ).toBe('none');
  });

  it('returns undefined for a name that is not defined yet', () => {
    expect(readMotion('not-defined-yet')).toBeUndefined();
  });
});

describe('contentKeyOf', () => {
  it('is equal for equal content, whatever the order of its keys and the form of its keyframes', () => {
    const key = contentKeyOf({ keyframes: { opacity: 0, y: 24 } });
    expect(contentKeyOf({ keyframes: [{ y: 24, opacity: 0 }] })).toBe(key);
    expect(contentKeyOf({ keyframes: { opacity: 0, y: 25 } })).not.toBe(key);
  });
});

describe('motion()', () => {
  it('refuses a spec without a verb, and names the entry that takes it', () => {
    const host = {} as MotionElement;
    expect(() => motion(host, { keyframes: { opacity: 0 } })).toThrow(
      TypeError,
    );
    expect(() => motion(host, grow)).toThrow(
      new TypeError(
        'motion() needs a spec with a verb; attach(element, { presence: … }) takes this one',
      ),
    );
  });
});
