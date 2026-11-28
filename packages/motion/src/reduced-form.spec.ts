import { describe, expect, it } from 'vitest';
import { readReducedWord, reducedPlan } from './reduced-form.js';
import type { StyleKeyframe } from './keyframes.js';

const rise: StyleKeyframe[] = [
  { opacity: 0, y: 24 },
  { opacity: 1, y: 0 },
];
const enter = { phase: 'enter', cause: 'policy' } as const;
const exit = { phase: 'exit', cause: 'policy' } as const;

describe('reducedPlan', () => {
  it('presence fade animates only opacity, and sets the rest at its end on an enter', () => {
    expect(reducedPlan(rise, 'fade', { contract: 'event', ...enter })).toEqual({
      fade: [{ opacity: 0 }, { opacity: 1 }],
      set: { y: 0 },
    });
  });

  it('presence fade on an exit keeps the other properties where they are', () => {
    expect(
      reducedPlan([{ y: 0 }, { y: 24 }], 'fade', {
        contract: 'event',
        ...exit,
      }),
    ).toEqual({
      fade: [{ opacity: 1 }, { opacity: 0 }],
      set: null,
    });
  });

  it('a motion with no opacity fades 0 to 1', () => {
    expect(
      reducedPlan([{ y: 24 }, { y: 0 }], 'fade', {
        contract: 'event',
        ...enter,
      }),
    ).toEqual({
      fade: [{ opacity: 0 }, { opacity: 1 }],
      set: { y: 0 },
    });
  });

  it('fade under a state fades the frame opacity and sets the rest, both ways', () => {
    const frames: StyleKeyframe[] = [
      { opacity: 0, y: 24 },
      { opacity: 0.5, y: 0 },
    ];
    const expected = { fade: [{ opacity: 0.5 }], set: { y: 0 } };
    expect(
      reducedPlan(frames, 'fade', { contract: 'state', ...enter }),
    ).toEqual(expected);
    expect(reducedPlan(frames, 'fade', { contract: 'state', ...exit })).toEqual(
      expected,
    );
  });

  it('fade under a driver is none', () => {
    expect(reducedPlan(rise, 'fade', { contract: 'driver', ...enter })).toEqual(
      { fade: null, set: null },
    );
  });

  it('start under a state is none', () => {
    expect(reducedPlan(rise, 'start', { contract: 'state', ...enter })).toEqual(
      { fade: null, set: null },
    );
  });

  it('fade is end under disabled and zero-scale', () => {
    const end = { fade: null, set: { opacity: 1, y: 0 } };
    expect(
      reducedPlan(rise, 'fade', {
        contract: 'event',
        phase: 'enter',
        cause: 'disabled',
      }),
    ).toEqual(end);
    expect(
      reducedPlan(rise, 'fade', {
        contract: 'event',
        phase: 'enter',
        cause: 'zero-scale',
      }),
    ).toEqual(end);
  });

  it('end, start, none and a keyframe', () => {
    const request = { contract: 'event', ...enter } as const;
    expect(reducedPlan(rise, 'end', request)).toEqual({
      fade: null,
      set: { opacity: 1, y: 0 },
    });
    expect(reducedPlan(rise, 'start', request)).toEqual({
      fade: null,
      set: { opacity: 0, y: 24 },
    });
    expect(reducedPlan(rise, 'none', request)).toEqual({
      fade: null,
      set: null,
    });
    expect(reducedPlan(rise, { opacity: 0.3 }, request)).toEqual({
      fade: null,
      set: { opacity: 0.3 },
    });
  });
  it('fade keeps the offsets of an opacity motion', () => {
    const frames: StyleKeyframe[] = [
      { opacity: 0, offset: 0 },
      { opacity: 0.3, offset: 0.3 },
      { opacity: 1, offset: 1 },
    ];
    expect(
      reducedPlan(frames, 'fade', { contract: 'event', ...enter }),
    ).toEqual({
      fade: frames,
      set: null,
    });
  });

  it('fade under a state whose frame has no opacity fades nothing and sets the frame', () => {
    expect(
      reducedPlan([{ y: 24 }, { y: 0 }], 'fade', {
        contract: 'state',
        ...enter,
      }),
    ).toEqual({
      fade: null,
      set: { y: 0 },
    });
  });

  it('fade under a state keeps the offset of its frame', () => {
    const frames: StyleKeyframe[] = [
      { opacity: 0, y: 24, offset: 0 },
      { opacity: 0.5, y: 0, offset: 1 },
    ];
    expect(
      reducedPlan(frames, 'fade', { contract: 'state', ...enter }),
    ).toEqual({
      fade: [{ opacity: 0.5, offset: 1 }],
      set: { y: 0 },
    });
  });

  it('fade under a driver is none, even under disabled', () => {
    expect(
      reducedPlan(rise, 'fade', {
        contract: 'driver',
        phase: 'enter',
        cause: 'disabled',
      }),
    ).toEqual({
      fade: null,
      set: null,
    });
  });

  it('start under a driver is the first frame', () => {
    expect(
      reducedPlan(rise, 'start', { contract: 'driver', ...enter }),
    ).toEqual({
      fade: null,
      set: { opacity: 0, y: 24 },
    });
  });

  it('a keyframe under a state is set at once', () => {
    expect(
      reducedPlan(rise, { opacity: 0.3 }, { contract: 'state', ...enter }),
    ).toEqual({
      fade: null,
      set: { opacity: 0.3 },
    });
  });
});

describe('readReducedWord', () => {
  it('maps the four words, instant to end and static to none', () => {
    expect(readReducedWord('fade')).toBe('fade');
    expect(readReducedWord('end')).toBe('end');
    expect(readReducedWord('start')).toBe('start');
    expect(readReducedWord('none')).toBe('none');
    expect(readReducedWord('instant')).toBe('end');
    expect(readReducedWord('static')).toBe('none');
    expect(readReducedWord('blink')).toBeUndefined();
  });
});
