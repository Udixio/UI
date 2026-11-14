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
