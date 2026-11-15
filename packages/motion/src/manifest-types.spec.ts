import { expectTypeOf, it } from 'vitest';
import { motionManifest, type MotionDocument } from './manifest.js';
import type { VisualFrame } from './contract.js';
import type { Verb, SpringRef, ReducedRender } from './motion-spec.js';
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
  void [scrubTimed, loopWithoutPause, controlReason, essentialWithoutReason, loopSpring, revealRange, revealExit];
});
