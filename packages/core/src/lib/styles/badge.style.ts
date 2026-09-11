import type { BadgeInterface } from '../interfaces';
import { type ClassNameComponent, cx, defaultClassNames } from '../utils';

/**
 * Measurements are Material 3's, from the badge specs.
 *
 * Placement is expressed the way the spec states it: the distance from the
 * icon's top trailing corner to the badge's bottom leading corner -- 6x6dp
 * small, 14x12dp large. Anchoring the leading edge is what lets a large badge
 * widen with its count without moving, and using logical properties is what
 * flips it for right-to-left, which the guidelines require.
 */
const badgeConfig: ClassNameComponent<BadgeInterface> = ({ variant }) => ({
  container: cx('relative inline-flex w-fit'),
  badge: cx(
    'absolute z-10 flex items-center justify-center rounded-full',
    'bg-error text-on-error pointer-events-none',
    variant === 'small' && 'size-1.5 bottom-[calc(100%-6px)] start-[calc(100%-6px)]',
    variant === 'large' &&
      'h-4 min-w-4 max-w-[34px] px-1 bottom-[calc(100%-14px)] start-[calc(100%-12px)]',
  ),
  label: cx('text-label-small leading-none truncate'),
});

export const badgeStyle = defaultClassNames<BadgeInterface>(
  'container',
  badgeConfig,
);
