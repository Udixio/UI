import { kindOf, resolveMotion, type MotionSpec } from './define-motion.js';

/** The values each element was warned about, so that a bad `--udx-motion` is reported once per element and value. */
const warned = new WeakMap<Element, Set<string>>();

/** Whether a named definition can replace a bound one: the same kind, and for a view motion the same verb (reveal or scrub). */
function sameFamily(named: Readonly<MotionSpec>, bound: Readonly<MotionSpec>): boolean {
  const kind = kindOf(bound.verb);
  return kindOf(named.verb) === kind && (kind !== 'view' || named.verb === bound.verb);
}

function warn(target: Element, value: string, reason: string): void {
  let values = warned.get(target);
  if (!values) warned.set(target, (values = new Set()));
  if (values.has(value)) return;
  values.add(value);
  console.error(`[@udixio/motion] --udx-motion "${value}" ${reason}: the motion of the element is played instead.`);
}

/**
 * The definition a trigger of `bound` plays on `target`. `--udx-motion` may name a defined motion of the same kind as `bound`
 * (in Tailwind, `md:[--udx-motion:rise]`): that motion replaces the bound one for this play, and the binding's own triggers
 * stay the same. `none` names no motion and is left to the play, which turns the motion off. Another kind, or a name that is
 * not defined, is ignored, and reported once per element and value in development.
 */
export function playedSpec<S extends Readonly<MotionSpec>>(target: Element, bound: S, development: boolean): S {
  const value = (target.ownerDocument.defaultView ?? window).getComputedStyle(target).getPropertyValue('--udx-motion').trim();
  if (value === '' || value === 'none') return bound;
  const ref = resolveMotion(value);
  if (ref && sameFamily(ref.spec, bound)) return ref.spec as S;
  if (development) warn(target, value, ref ? 'names a motion of another kind' : 'names no defined motion');
  return bound;
}
