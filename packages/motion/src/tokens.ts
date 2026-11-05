import { springData } from './spring-data.generated.js';

/** Material 3 motion scheme selected for a product. */
export type MotionScheme = 'expressive' | 'standard';
/** Physical spring parameters and the official last-resort web approximation. */
export type SpringToken = {
  dampingRatio: number;
  stiffness: number;
  fallback: { duration: number; easing: string };
  linear: { duration: number; easing: string };
};
export type MotionTokens = {
  spring: Record<'fast' | 'default' | 'slow', Record<'spatial' | 'effects', SpringToken>>;
};

function token(source: (typeof springData.effects)[number] | (typeof springData.expressive)[number] | (typeof springData.standard)[number]): SpringToken {
  return { ...source, fallback: { ...source.fallback }, linear: { ...source.linear } };
}
/** Select a product-wide M3 scheme. Durations are in milliseconds. */
export function defineTokens(options: { scheme?: MotionScheme } = {}): MotionTokens {
  const scheme = options.scheme ?? 'expressive';
  if (scheme !== 'expressive' && scheme !== 'standard') {
    throw new RangeError(`Unknown motion scheme: ${String(scheme)}`);
  }
  const pair = (index: number) => ({ spatial: token(springData[scheme][index]), effects: token(springData.effects[index]) });
  return { spring: { fast: pair(0), default: pair(1), slow: pair(2) } };
}
