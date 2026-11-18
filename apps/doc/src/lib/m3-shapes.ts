/**
 * Build-time paths of the Material 3 expressive shapes. A shape is a closed polyline of 96 points around (50, 50), with
 * the radius r(θ) = 46 · (1 − d · (0.5 − 0.5 · cos(n · θ + φ))): `n` is the number of lobes, `d` how deep they cut, and
 * `φ` the phase. Each scene calls it once, when the page is built, so no shape is computed in the browser.
 */
const POINTS = 96;
const RADIUS = 46;
const CENTRE = 50;

/** The SVG path (`d`) of the shape with `n` lobes, depth `d` and phase `phi`, in a 100 × 100 box. */
export function shapePath(n: number, d: number, phi: number): string {
  const points: string[] = [];
  for (let i = 0; i < POINTS; i++) {
    const theta = (2 * Math.PI * i) / POINTS;
    const r = RADIUS * (1 - d * (0.5 - 0.5 * Math.cos(n * theta + phi)));
    const x = CENTRE + r * Math.cos(theta);
    const y = CENTRE + r * Math.sin(theta);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${points.join(' ')} Z`;
}
