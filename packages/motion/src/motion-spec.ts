/** Semantic intent of a motion definition. */
export type Verb = 'appear' | 'disappear' | 'emphasize' | 'reveal' | 'scrub' | 'loop' | 'layout';

/** Reference to a product-wide Material 3 spring token. */
export type SpringRef = `spring.${'fast' | 'default' | 'slow'}.${'spatial' | 'effects'}`;

/** Visual result used when reduced motion is requested. */
export type ReducedRender = 'fade' | 'instant' | 'static' | 'neutral' | 'frozen';
