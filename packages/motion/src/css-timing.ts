import type { SpringRef } from './motion-spec.js';
import { defineTokens, resolveCurve, type CurveTiming } from './tokens.js';

/** The speeds and kinds of the spring tokens, as the references and the CSS custom properties name them. */
const SPEEDS: readonly string[] = ['fast', 'default', 'slow'];
const KINDS: readonly string[] = ['spatial', 'effects'];

/**
 * The CSS `transition-duration` and `transition-timing-function` of a motion token, for a stylesheet. A spring names the
 * `--udx-motion-spring-*` custom properties of `motion.css`, with the official cubic-bezier fallback of the expressive
 * scheme when the stylesheet is absent; a curve is its duration in milliseconds and its CSS easing. Pure: it reads no
 * document, so it is safe on the server.
 * @param timing - A spring token or a curve.
 * @returns A CSS `duration` and `easing`, for a transition or an animation.
 */
export function cssTiming(timing: SpringRef | CurveTiming): { duration: string; easing: string } {
  if (typeof timing === 'string') {
    const parts = timing.split('.');
    const [, speed, kind] = parts;
    if (parts.length !== 3 || parts[0] !== 'spring' || !SPEEDS.includes(speed!) || !KINDS.includes(kind!)) {
      throw new RangeError('Unknown spring reference');
    }
    const fallback = defineTokens({ scheme: 'expressive' }).spring[speed as 'fast'][kind as 'spatial'].fallback;
    const name = `--udx-motion-spring-${speed}-${kind}`;
    return {
      duration: `var(${name}-duration, ${fallback.duration}ms)`,
      easing: `var(${name}-easing, ${fallback.easing})`,
    };
  }
  const curve = resolveCurve(timing);
  return { duration: `${curve.duration}ms`, easing: curve.easing };
}
