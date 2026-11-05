import { expectTypeOf, test } from 'vitest';
import type { Verb, SpringRef, ReducedRender } from './index.js';

test('public motion vocabulary matches the specified domains', () => {
  expectTypeOf<Verb>().toEqualTypeOf<'appear' | 'disappear' | 'emphasize' | 'reveal' | 'scrub' | 'loop' | 'layout'>();
  expectTypeOf<SpringRef>().toEqualTypeOf<
    | 'spring.fast.spatial' | 'spring.fast.effects'
    | 'spring.default.spatial' | 'spring.default.effects'
    | 'spring.slow.spatial' | 'spring.slow.effects'
  >();
  expectTypeOf<ReducedRender>().toEqualTypeOf<'fade' | 'instant' | 'static' | 'neutral' | 'frozen'>();
});
