import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MotionElement } from './contract.js';
import { motion } from './bind.js';
import { contentKeyOf, defineMotion, readMotion } from './define-motion.js';
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
      }),
    ).toMatchObject({ reduced: 'end' });
    expect(
      readMotion({
        verb: 'emphasize',
        keyframes: [{ scale: 1 }],
        reduced: 'static',
      }),
    ).toMatchObject({ reduced: 'none' });
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

describe('readMotion: a reading, or an unread motion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gives an UnreadMotion for a layout motion, which has no keyframes', () => {
    expect(readMotion('reflow')).toEqual({
      name: 'reflow',
      key: expect.any(String),
      frames: null,
      reason: 'no-keyframes',
    });
  });

  it('gives an UnreadMotion, whole, when a keyframe of a legacy motion holds only draw or along', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(
      readMotion({ verb: 'appear', keyframes: [{ opacity: 0 }, { draw: 1 }] }),
    ).toMatchObject({
      frames: null,
      reason: 'empty-keyframe',
    });
    expect(
      readMotion({ verb: 'appear', keyframes: [{ opacity: 0 }, { along: 1 }] }),
    ).toMatchObject({
      frames: null,
      reason: 'empty-keyframe',
    });
  });

  it('reads a legacy motion without draw and along when every keyframe keeps a property, and reports the skip once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const reading = readMotion({
      verb: 'appear',
      keyframes: [{ opacity: 0, draw: 1 }, { opacity: 1 }],
    });
    expect(reading && 'frames' in reading ? reading.frames : undefined).toEqual(
      [{ opacity: 0 }, { opacity: 1 }],
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('motion() and a motion without a verb', () => {
  it('throws on each call with the same reference, and refuses an inline spec before it validates it', () => {
    const host = {} as MotionElement;
    const ref = defineMotion('verbless-refused-twice', {
      keyframes: { opacity: 0.5 },
    });
    expect(() => motion(host, ref)).toThrow(TypeError);
    expect(() => motion(host, ref)).toThrow(TypeError);
    expect(() => motion(host, { keyframes: {} } as never)).toThrow(
      'motion() needs a spec with a verb',
    );
  });
});
