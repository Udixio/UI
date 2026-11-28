import { expectTypeOf, it } from 'vitest';
import { defineMotion } from './define-motion.js';
import { motionManifest, type MotionDocument } from './manifest.js';
import type { VisualFrame } from './contract.js';
import type { Verb, SpringRef, ReducedRender } from './motion-spec.js';
import type { SequenceStep } from './sequence.js';
it('derives public domains and visual fields from the manifest', () => {
  expectTypeOf<Verb>().toEqualTypeOf<
    (typeof motionManifest.domains.verbs)[number]
  >();
  expectTypeOf<SpringRef>().toEqualTypeOf<
    (typeof motionManifest.domains.springs)[number]
  >();
  expectTypeOf<ReducedRender>().toEqualTypeOf<
    (typeof motionManifest.domains.reduced)[number]
  >();
  expectTypeOf<keyof VisualFrame>().toEqualTypeOf<
    (typeof motionManifest.domains.visualFields)[number]
  >();
  const value: MotionDocument = {
    version: 1,
    spec: { verb: 'emphasize', keyframes: [{ x: 0 }], interrupt: 'carry' },
  };
  expectTypeOf(value).toMatchTypeOf<MotionDocument>();
  const invalid: MotionDocument = {
    version: 1,
    // @ts-expect-error interrupt is not supported on appear
    spec: { verb: 'appear', keyframes: [{ x: 0 }], interrupt: 'carry' },
  };
  void invalid;
});
it('types the reveal, scrub and loop specs and refuses what their verbs do not take', () => {
  const reveal: MotionDocument = { version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 0 }], repeat: 'once', axis: 'block', stagger: 'normal', timing: { duration: 'duration.medium2', easing: 'easing.standard' } } };
  const scrub: MotionDocument = { version: 1, spec: { verb: 'scrub', keyframes: [{ y: 48 }, { y: -48 }], range: 'cross', axis: 'inline' } };
  const control: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ rotate: 0 }, { rotate: 360 }], pause: 'control' } };
  const essential: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ scale: 1 }], pause: 'essential', reason: 'Signals activity.' } };
  void [reveal, scrub, control, essential];
  // @ts-expect-error scrub takes no timing
  const scrubTimed: MotionDocument = { version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], timing: 'spring.default.spatial' } };
  // @ts-expect-error loop requires pause
  const loopWithoutPause: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }] } };
  // @ts-expect-error a control loop takes no reason
  const controlReason: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', reason: 'x' } };
  // @ts-expect-error an essential loop requires its reason
  const essentialWithoutReason: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'essential' } };
  // @ts-expect-error loop takes only a curve timing
  const loopSpring: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', timing: 'spring.default.spatial' } };
  // @ts-expect-error range is a scrub option
  const revealRange: MotionDocument = { version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 0 }], range: 'cross' } };
  // @ts-expect-error exit belongs to appear and disappear
  const revealExit: MotionDocument = { version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 0 }], exit: 'in-place' } };
  // @ts-expect-error split belongs to appear, disappear and reveal
  const scrubSplit: MotionDocument = { version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], split: 'words' } };
  // @ts-expect-error split takes a letter, word or line domain
  const revealSplitValue: MotionDocument = { version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 0 }], split: 'sentences' } };
  const revealSplit: MotionDocument = { version: 1, spec: { verb: 'reveal', keyframes: [{ opacity: 0 }], split: 'chars' } };
  void [scrubTimed, loopWithoutPause, controlReason, essentialWithoutReason, loopSpring, revealRange, revealExit, scrubSplit, revealSplitValue, revealSplit];
});
it('types the reduced render of each verb that takes one, and refuses it on the verbs that follow reduced motion their own way', () => {
  const appearInstant: MotionDocument = { version: 1, spec: { verb: 'appear', keyframes: [{ opacity: 0 }], reduced: 'instant' } };
  const emphasizeStatic: MotionDocument = { version: 1, spec: { verb: 'emphasize', keyframes: [{ scale: 1 }], reduced: 'static' } };
  void [appearInstant, emphasizeStatic];
  // @ts-expect-error appear renders fade or instant under reduced motion
  const appearStatic: MotionDocument = { version: 1, spec: { verb: 'appear', keyframes: [{ opacity: 0 }], reduced: 'static' } };
  // @ts-expect-error emphasize renders static or fade under reduced motion
  const emphasizeInstant: MotionDocument = { version: 1, spec: { verb: 'emphasize', keyframes: [{ scale: 1 }], reduced: 'instant' } };
  // @ts-expect-error a scrub stays where it is under reduced motion: it takes no reduced option
  const scrubReduced: MotionDocument = { version: 1, spec: { verb: 'scrub', keyframes: [{ y: 1 }], reduced: 'neutral' } };
  // @ts-expect-error a loop does not play under reduced motion: it takes no reduced option
  const loopReduced: MotionDocument = { version: 1, spec: { verb: 'loop', keyframes: [{ opacity: 1 }], pause: 'control', reduced: 'frozen' } };
  // @ts-expect-error a layout applies at once under reduced motion: it takes no reduced option
  const layoutReduced: MotionDocument = { version: 1, spec: { verb: 'layout', reduced: 'instant' } };
  void [appearStatic, emphasizeInstant, scrubReduced, loopReduced, layoutReduced];
});
it('takes the appear renders as the reduced render of a sequence step, which plays as an appear motion', () => {
  expectTypeOf<NonNullable<SequenceStep['reduced']>>().toEqualTypeOf<(typeof motionManifest.spec.reducedValues.appear)[number]>();
});

it('types a motion without a verb, and refuses on it the options of the old model', () => {
  // Type-checked only: a refused call would throw in development, so the function is never run.
  const typed = (): void => {
    defineMotion('lift', { keyframes: { scale: 1.04 } });
    defineMotion('slide-off', { keyframes: { x: '100%', backgroundColor: 'red', '--x': 1 } });
    defineMotion('lift-verb', { verb: 'appear', keyframes: [{ opacity: 0 }, { opacity: 1 }] });
    // @ts-expect-error a motion without a verb needs keyframes
    defineMotion('no-keyframes', { timing: 'spring.default.spatial' });
    // @ts-expect-error a motion without a verb takes no stagger
    defineMotion('verbless-stagger', { keyframes: { opacity: 0 }, stagger: 'normal' });
    // @ts-expect-error a motion without a verb takes no instant reduced form
    defineMotion('verbless-instant', { keyframes: { opacity: 0 }, reduced: 'instant' });
  };
  void typed;
});
