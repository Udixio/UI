import type { BadgeProps, BadgeStates } from '../interfaces/badge.interface.js';

/**
 * Resolves the text a badge shows, capping a numeric label at `max`.
 *
 * Returns `undefined` when there is nothing to show, which is what makes the
 * badge the small dot rather than the large pill.
 */
export function resolveBadgeLabel({
  label,
  max,
}: Pick<BadgeProps, 'label' | 'max'>): string | undefined {
  if (label === undefined || label === null || label === '') return undefined;
  if (typeof label === 'number' && max !== undefined && label > max) {
    return `${max}+`;
  }
  return String(label);
}

/**
 * Material 3 describes two badge variants, but what separates them is only
 * whether the badge carries text. Deriving it removes the state a `variant`
 * prop would allow but the design does not have: a small badge with a label.
 */
export function resolveBadgeVariant(
  label: string | undefined,
): BadgeStates['variant'] {
  return label === undefined ? 'small' : 'large';
}
