import { describe, expect, it } from 'vitest';
import type { StyleKeyframe } from './keyframes.js';
import { timeScaleIn } from './motion-style.js';
import { planTiming } from './timing-plan.js';

const rise: StyleKeyframe[] = [
  { opacity: 0, y: 24 },
  { opacity: 1, y: 0 },
];

describe('planTiming', () => {
  it('gives an event the default spring of each property, spatial first', () => {
    const plan = planTiming(rise, { contract: 'event', scale: 1 });
    expect(plan.groups).toEqual([
      { channels: new Set(['y']), timing: 'spring.default.spatial' },
      { channels: new Set(['opacity']), timing: 'spring.default.effects' },
    ]);
  });

  it('gives a state the fast springs', () => {
    const plan = planTiming(rise, { contract: 'state', scale: 1 });
    expect(plan.groups).toEqual([
      { channels: new Set(['y']), timing: 'spring.fast.spatial' },
      { channels: new Set(['opacity']), timing: 'spring.fast.effects' },
    ]);
  });

  it('gives every property of an exit the effects spring', () => {
    const plan = planTiming(rise, { contract: 'event', exit: true, scale: 1 });
    expect(plan.groups).toEqual([
      { channels: new Set(['opacity', 'y']), timing: 'spring.default.effects' },
    ]);
  });

  it('applies a timing of its own to every property', () => {
    const plan = planTiming(rise, {
      contract: 'event',
      timing: 'spring.default.spatial',
      scale: 1,
    });
    expect(plan.groups).toEqual([
      { channels: new Set(['opacity', 'y']), timing: 'spring.default.spatial' },
    ]);
  });

  it('counts an unknown property as an effect', () => {
    const plan = planTiming(
      [
        { '--glow': 0, y: 0 },
        { '--glow': 1, y: 8 },
      ],
      { contract: 'event', scale: 1 },
    );
    expect(plan.groups).toEqual([
      { channels: new Set(['y']), timing: 'spring.default.spatial' },
      { channels: new Set(['--glow']), timing: 'spring.default.effects' },
    ]);
  });

  it('multiplies the delay by the scale, and only the delay', () => {
    expect(
      planTiming(rise, { contract: 'event', delay: 100, scale: 0.5 }).delay,
    ).toBe(50);
    expect(
      planTiming(rise, { contract: 'event', delay: 100, scale: 2 }).delay,
    ).toBe(200);
    expect(
      planTiming(rise, { contract: 'event', delay: 100, scale: 10 }).delay,
    ).toBe(1000);
    expect(planTiming(rise, { contract: 'event', scale: 1 }).delay).toBe(0);
  });

  it('gives a driver one linear group, with no delay', () => {
    const plan = planTiming(rise, { contract: 'driver', delay: 100, scale: 2 });
    expect(plan.delay).toBe(0);
    expect(plan.groups).toEqual([
      {
        channels: new Set(['opacity', 'y']),
        timing: { duration: 'duration.extraLong4', easing: 'easing.linear' },
      },
    ]);
  });
});

describe('timeScaleIn', () => {
  const style = (value: string) =>
    ({ getPropertyValue: () => value }) as unknown as CSSStyleDeclaration;

  it('reads the scale with no upper bound, a negative value as 0, and an absent one as 1', () => {
    expect(timeScaleIn(style('4'))).toBe(4);
    expect(timeScaleIn(style('10'))).toBe(10);
    expect(timeScaleIn(style('0.5'))).toBe(0.5);
    expect(timeScaleIn(style('-1'))).toBe(0);
    expect(timeScaleIn(style(''))).toBe(1);
    expect(timeScaleIn(style('fast'))).toBe(1);
  });
});
