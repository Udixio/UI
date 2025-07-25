import { expressiveVariant } from './expressive.variant';
import { neutralVariant } from './neutral.variant';
import { tonalSpotVariant } from './tonal-spot.variant';
import { vibrantVariant } from './vibrant.variant';

export * from './tonal-spot.variant';
export * from './vibrant.variant';
export * from './expressive.variant';
export * from './neutral.variant';

export const Variants = {
  Expressive: expressiveVariant,
  Neutral: neutralVariant,
  TonalSpot: tonalSpotVariant,
  Vibrant: vibrantVariant,
};
