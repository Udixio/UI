import { cubicBezier } from 'animejs';

// CSS <number>: decimal notation with an optional sign and exponent.
const number = '[+-]?(?:[0-9]*\\.[0-9]+|[0-9]+)(?:[eE][+-]?[0-9]+)?';
const whitespace = '[\\t\\n\\f\\r ]*';
const cubic = new RegExp(`^${whitespace}cubic-bezier\\(${whitespace}(${number})${whitespace},${whitespace}(${number})${whitespace},${whitespace}(${number})${whitespace},${whitespace}(${number})${whitespace}\\)${whitespace}$`, 'i');
const linear = /^[\t\n\f\r ]*linear[\t\n\f\r ]*$/i;

/** The anime.js easing of a CSS easing: `linear`, or a `cubic-bezier()` the engine takes; any other easing throws. */
export function animejsEase(easing: string): ReturnType<typeof cubicBezier> | 'linear' {
  if (linear.test(easing)) return 'linear';
  const match = cubic.exec(easing);
  if (match) {
    const parts = match.slice(1);
    const coordinates = parts.map(Number);
    // Restrict precision before conversion so rounding cannot admit x outside
    // [0, 1], or turn a nonzero negative coordinate into negative zero.
    const representable = parts.every((part, index) => {
      const digits = part.split(/[eE]/)[0].replace(/[^0-9]/g, '').replace(/^0+/, '');
      return digits.length <= 15 && (digits.length === 0 || coordinates[index] !== 0);
    });
    // Bound y so Anime.js's cubic polynomial stays finite for finite progress.
    if (representable && coordinates.every(Number.isFinite) && coordinates[0] >= 0 && coordinates[0] <= 1 &&
        coordinates[2] >= 0 && coordinates[2] <= 1 &&
        Math.abs(coordinates[1]) <= 1e6 && Math.abs(coordinates[3]) <= 1e6) {
      return cubicBezier(coordinates[0], coordinates[1], coordinates[2], coordinates[3]);
    }
  }
  throw new TypeError(`Unsupported animejs easing: ${easing}`);
}
