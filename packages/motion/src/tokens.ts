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
function linearSpring(dampingRatio: number, stiffness: number): SpringToken['linear'] {
  const omega = Math.sqrt(stiffness);
  const damped = Math.sqrt(1 - dampingRatio ** 2);
  const response = (t: number) => dampingRatio === 1
    ? 1 - (1 + omega * t) * Math.exp(-omega * t)
    : 1 - Math.exp(-dampingRatio * omega * t) * (Math.cos(omega * damped * t) + dampingRatio / damped * Math.sin(omega * damped * t));
  // Bound the remaining oscillation; critical damping uses its exact tail.
  let seconds = 0;
  while (dampingRatio === 1
    ? (1 + omega * seconds) * Math.exp(-omega * seconds) > 0.002
    : Math.exp(-dampingRatio * omega * seconds) / damped > 0.002) seconds += 0.001;
  const duration = Math.round(seconds * 1000);
  const value = (x: number) => response(x * duration / 1000);
  const stops = [0, 1];
  // Split at the largest interpolation error, evaluating a fine fixed grid.
  while (stops.length < 26) {
    let worstError = -1;
    let worstPosition = 0;
    for (let segment = 0; segment < stops.length - 1; segment++) {
      const a = stops[segment], b = stops[segment + 1];
      const va = value(a), vb = value(b);
      for (let i = 1; i < 100; i++) {
        const x = a + (b - a) * i / 100;
        const error = Math.abs(value(x) - (va + (vb - va) * i / 100));
        if (error > worstError) { worstError = error; worstPosition = x; }
      }
    }
    stops.push(worstPosition);
    stops.sort((a, b) => a - b);
  }
  return { duration, easing: `linear(${stops.map(x => `${Number(value(x).toFixed(6))} ${Number((x * 100).toFixed(4))}%`).join(', ')})` };
}
function token([dampingRatio, stiffness, duration, easing]: Tuple): SpringToken {
  return { dampingRatio, stiffness, fallback: { duration, easing }, linear: linearSpring(dampingRatio, stiffness) };
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
