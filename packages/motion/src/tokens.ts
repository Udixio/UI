/** Material 3 motion scheme selected for a product. */
export type MotionScheme = 'expressive' | 'standard';
/** Physical spring parameters and the official last-resort web approximation. */
export type SpringToken = {
  dampingRatio: number;
  stiffness: number;
  fallback: { duration: number; easing: string };
};
export type MotionTokens = {
  spring: Record<'fast' | 'default' | 'slow', Record<'spatial' | 'effects', SpringToken>>;
};

type Tuple = readonly [number, number, number, string];
const effects: readonly Tuple[] = [
  [1, 3800, 150, 'cubic-bezier(0.31, 0.94, 0.34, 1)'],
  [1, 1600, 200, 'cubic-bezier(0.34, 0.8, 0.34, 1)'],
  [1, 800, 300, 'cubic-bezier(0.34, 0.88, 0.34, 1)'],
];
const spatial: Record<MotionScheme, readonly Tuple[]> = {
  expressive: [
    [0.6, 800, 350, 'cubic-bezier(0.42, 1.67, 0.21, 0.9)'],
    [0.8, 380, 500, 'cubic-bezier(0.38, 1.21, 0.22, 1)'],
    [0.8, 200, 650, 'cubic-bezier(0.39, 1.29, 0.35, 0.98)'],
  ],
  standard: [
    [0.9, 1400, 350, 'cubic-bezier(0.27, 1.06, 0.18, 1)'],
    [0.9, 700, 500, 'cubic-bezier(0.27, 1.06, 0.18, 1)'],
    [0.9, 300, 750, 'cubic-bezier(0.27, 1.06, 0.18, 1)'],
  ],
};
function token([dampingRatio, stiffness, duration, easing]: Tuple): SpringToken {
  return { dampingRatio, stiffness, fallback: { duration, easing } };
}
/** Select a product-wide M3 scheme. Durations are in milliseconds. */
export function defineTokens(options: { scheme?: MotionScheme } = {}): MotionTokens {
  const scheme = options.scheme ?? 'expressive';
  if (scheme !== 'expressive' && scheme !== 'standard') {
    throw new RangeError(`Unknown motion scheme: ${String(scheme)}`);
  }
  const pair = (index: number) => ({ spatial: token(spatial[scheme][index]), effects: token(effects[index]) });
  return { spring: { fast: pair(0), default: pair(1), slow: pair(2) } };
}
