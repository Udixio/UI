import type { BadgeInterface } from '../interfaces';
import { type ClassNameComponent, cx, defaultClassNames } from '../utils';

/**
 * Measurements are Material 3's, from the badge specs.
 *
 * The one they state that is not applied is the 34dp maximum width. Material
 * gives it as the size a large badge reaches at four characters, in their own
 * font; ours renders `999+` one pixel wider, and clamping to 34dp truncated it
 * to `99...`. Silently dropping a caller's text is the failure this component
 * documents that it does not commit, so the badge grows with its content and
 * the four-character limit stays guidance.
 *
 * Placement is expressed the way the spec states it: the distance from the
 * icon's top trailing corner to the badge's bottom leading corner -- 6x6dp
 * small, 14x12dp large. Anchoring the leading edge is what lets a large badge
 * widen with its count without moving, and using logical properties is what
 * flips it for right-to-left, which the guidelines require.
 */
const badgeConfig: ClassNameComponent<BadgeInterface> = ({
  variant,
  attached,
}) => ({
  // Wrapping, the container is an extra box that must shrink to its child;
  // attached, it is the child, and only needs to be the containing block.
  container: cx('relative', !attached && 'inline-flex w-fit'),
  badge: cx(
    'absolute z-10 flex items-center justify-center rounded-full',
    'bg-error text-on-error pointer-events-none',
    variant === 'small' && 'size-1.5 bottom-[calc(100%-6px)] start-[calc(100%-6px)]',
    variant === 'large' &&
      'h-4 min-w-4 px-1 bottom-[calc(100%-14px)] start-[calc(100%-12px)]',
  ),
  label: cx('text-label-small leading-none'),
  // `role="status"` is a live region, and a screen reader announces the content
  // that changed rather than the element's label. The description therefore has
  // to be content, not an `aria-label`, or a count going 3 -> 4 announces "4".
  announcement: cx('sr-only'),
});

export const badgeStyle = defaultClassNames<BadgeInterface>(
  'container',
  badgeConfig,
);
