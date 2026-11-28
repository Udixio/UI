import { describe, expect, it } from 'vitest';
import type { VisualFrame } from './contract.js';
import { NEUTRAL_AXIS_BASE, parseAxisBase } from './axis-base.js';
import {
  SPATIAL_PROPERTIES,
  channelsOf,
  propertyOf,
  readKeyframes,
  toWaapiKeyframes,
  type StyleKeyframe,
} from './keyframes.js';
import { frameToKeyframe } from './providers/waapi.js';

describe('readKeyframes', () => {
  it('takes one keyframe or a list', () => {
    expect(readKeyframes({ x: 1 })).toEqual([{ x: 1 }]);
    expect(readKeyframes([{ x: 1 }, { x: 2 }])).toEqual([{ x: 1 }, { x: 2 }]);
  });

  it('throws on an empty list', () => {
    expect(() => readKeyframes([])).toThrow(TypeError);
  });

  it('refuses a keyframe that writes translate and x or y, which would fight over the same property', () => {
    expect(() => readKeyframes({ translate: '1px 2px', x: 3 })).toThrow(
      TypeError,
    );
    expect(() => readKeyframes({ scale: 2, scaleX: 3 })).toThrow(TypeError);
  });
});

describe('channelsOf', () => {
  it('splits the shorthands into their axes', () => {
    expect(channelsOf([{ x: 1, y: 2 }])).toEqual(new Set(['x', 'y']));
    expect(channelsOf([{ scale: 1.1 }])).toEqual(new Set(['scaleX', 'scaleY']));
    expect(channelsOf([{ translate: '1px 2px' }])).toEqual(new Set(['x', 'y']));
  });

  it('keeps one channel per other property, custom properties by their name', () => {
    expect(channelsOf([{ backgroundColor: 'red' }])).toEqual(
      new Set(['background-color']),
    );
    expect(channelsOf([{ '--glow': 1 }])).toEqual(new Set(['--glow']));
    expect(channelsOf([{ rotate: 90 }])).toEqual(new Set(['rotate']));
  });

  it('leaves out a null value, which keeps the underlying value', () => {
    expect(channelsOf([{ x: null, opacity: 0 }])).toEqual(new Set(['opacity']));
  });
});

describe('propertyOf', () => {
  it('maps the four axis channels to their property, and any other channel to itself', () => {
    expect(propertyOf('x')).toBe('translate');
    expect(propertyOf('y')).toBe('translate');
    expect(propertyOf('scaleX')).toBe('scale');
    expect(propertyOf('scaleY')).toBe('scale');
    expect(propertyOf('rotate')).toBe('rotate');
  });
});

describe('SPATIAL_PROPERTIES', () => {
  it('holds the spatial longhands and leaves out the effects', () => {
    for (const name of [
      'translate',
      'width',
      'margin-inline-start',
      'padding-top',
      'inset-block-end',
      'gap',
      'border-top-left-radius',
    ]) {
      expect(SPATIAL_PROPERTIES.has(name)).toBe(true);
    }
    expect(SPATIAL_PROPERTIES.has('opacity')).toBe(false);
    expect(SPATIAL_PROPERTIES.has('background-color')).toBe(false);
  });
});

describe('toWaapiKeyframes', () => {
  const all = (frames: StyleKeyframe[]) =>
    toWaapiKeyframes(frames, channelsOf(frames), NEUTRAL_AXIS_BASE);

  it('writes the missing axis from the base', () => {
    expect(all([{ y: 24 }])).toEqual([{ translate: '0px 24px' }]);
    expect(all([{ x: '100%' }])).toEqual([{ translate: '100% 0px' }]);
    expect(all([{ scaleX: 2 }])).toEqual([{ scale: '2 1' }]);
    expect(all([{ rotate: 90 }])).toEqual([{ rotate: '90deg' }]);
  });

  it('keeps the percentage of the axis a motion does not name, in every keyframe', () => {
    const base = parseAxisBase('-50% 12px', 'none');
    const frames = [{ y: 0 }, { y: -2 }];
    expect(toWaapiKeyframes(frames, channelsOf(frames), base)).toEqual([
      { translate: '-50% 0px' },
      { translate: '-50% -2px' },
    ]);
  });

  it('keeps the third value of the base', () => {
    const base = parseAxisBase('0px 0px 10px', 'none');
    expect(toWaapiKeyframes([{ y: 4 }], new Set(['y']), base)).toEqual([
      { translate: '0px 4px 10px' },
    ]);
  });

  it('writes only the channels asked for', () => {
    expect(
      toWaapiKeyframes(
        [{ x: 8, opacity: 0 }],
        new Set(['opacity']),
        NEUTRAL_AXIS_BASE,
      ),
    ).toEqual([{ opacity: 0 }]);
  });

  it('writes WAAPI keys in camelCase, and a custom property by its name', () => {
    expect(all([{ backgroundColor: 'red', '--glow': 1 }])).toEqual([
      { backgroundColor: 'red', '--glow': 1 },
    ]);
    expect(
      all([{ 'background-color': 'red', 'offset-distance': '50%' }]),
    ).toEqual([{ backgroundColor: 'red', offsetDistance: '50%' }]);
  });

  it('leaves out a null value, which keeps the underlying value', () => {
    expect(
      toWaapiKeyframes(
        [{ x: null, opacity: 0 }],
        new Set(['x', 'opacity']),
        NEUTRAL_AXIS_BASE,
      ),
    ).toEqual([{ opacity: 0 }]);
  });

  it('writes the third scale value of the base back as the third value of scale', () => {
    expect(
      toWaapiKeyframes(
        [{ scaleX: 2 }],
        new Set(['scaleX']),
        parseAxisBase('none', '1 2 3'),
      ),
    ).toEqual([{ scale: '2 2 3' }]);
  });

  it('keeps an offset', () => {
    expect(all([{ offset: 0.5, opacity: 1 }])).toEqual([
      { offset: 0.5, opacity: 1 },
    ]);
  });

  it('gives what frameToKeyframe gives for a legacy numeric keyframe on a neutral base', () => {
    const legacy: VisualFrame[] = [
      { x: 4, y: -2, scale: 1.1, rotate: 30, opacity: 0.5 },
      { scaleX: 2 },
      { opacity: 0 },
    ];
    for (const frame of legacy) {
      expect(all([frame as StyleKeyframe])).toEqual([frameToKeyframe(frame)]);
    }
  });
});

describe('readKeyframes: every frame holds a property', () => {
  it('refuses a keyframe that holds only offset, draw or along, which are not properties', () => {
    expect(() => readKeyframes({ offset: 0 })).toThrow('at least one property');
    expect(() => readKeyframes([{ opacity: 0 }, { draw: 1 }])).toThrow(
      TypeError,
    );
    expect(() =>
      readKeyframes([{ opacity: 0 }, { along: 1, offset: 1 }]),
    ).toThrow(TypeError);
  });
});
