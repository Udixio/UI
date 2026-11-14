import type {
  ManifestVerb,
  ManifestSpringRef,
  ManifestReduced,
} from './manifest.js';
/** Semantic intent of a motion definition. */
export type Verb = ManifestVerb;
/** Reference to a product-wide Material 3 spring token. */
export type SpringRef = ManifestSpringRef;
/** Visual result used when reduced motion is requested. */
export type ReducedRender = ManifestReduced;
