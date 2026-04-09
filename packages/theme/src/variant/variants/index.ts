import { expressiveVariant } from './expressive.variant';
import { neutralVariant } from './neutral.variant';
import { tonalSpotVariant } from './tonal-spot.variant';
import { vibrantVariant } from './vibrant.variant';
import { udixioVariant } from './udixio.variant';

export * from './tonal-spot.variant';
export * from './vibrant.variant';
export * from './expressive.variant';
export * from './neutral.variant';

export const Variants = {
  Expressive: expressiveVariant,
  Neutral: neutralVariant,
  TonalSpot: tonalSpotVariant,
  Vibrant: vibrantVariant,
  Udixio: udixioVariant,
};

export function getVariantByName(name: string): (typeof Variants)[keyof typeof Variants] {
  const found = Object.values(Variants).find((v) => v.name === name);
  if (!found) {
    throw new Error(`Unknown variant: "${name}". Known: ${Object.values(Variants).map((v) => v.name).join(', ')}`);
  }
  return found;
}
