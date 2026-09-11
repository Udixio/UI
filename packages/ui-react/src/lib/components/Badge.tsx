import type { ComponentProps, ReactNode } from 'react';
import {
  badgeStyle,
  resolveBadgeLabel,
  resolveBadgeVariant,
  type ComponentClassName,
  type BadgeInterface,
  type BadgeProps,
} from '@udixio/core';
import { createUseStyle } from '../utils/create-use-style';

export type ReactBadgeProps = BadgeProps &
  ComponentClassName<BadgeInterface> & {
    /** The icon or item the badge is anchored to. */
    children?: ReactNode;
  } & Omit<ComponentProps<'span'>, 'className' | 'children'>;

export const useBadgeStyle = createUseStyle(badgeStyle);

/**
 * @status beta
 * @category Communication
 * @devx
 * - Wrap what the badge marks: `<Badge label={3}><Icon icon={iInbox} /></Badge>`.
 *   The wrapper provides the positioned container itself, so the anchoring
 *   never depends on a `relative` the caller has to remember.
 * - No `label` renders the small dot Material uses for an unread notification;
 *   any label renders the large pill. The variant follows from the content, so
 *   a small badge carrying a count cannot be expressed.
 * - `max` caps a count the way Material spells it: `label={100} max={99}`
 *   renders `99+`.
 * - Hiding the badge once its destination is selected is the caller's
 *   decision, so there is no prop for it -- render it conditionally.
 * @a11y
 * - `description` is what a screen reader announces. Give it the meaning, not
 *   the number: `3 unread messages`, not `3`.
 * - Without a `description` the badge is hidden from assistive technology
 *   rather than announced as a bare digit or as nothing at all.
 * @limitations
 * - Material limits badge content to four characters including the `+`.
 *   Nothing truncates: silently dropping a caller's text would hide data, and
 *   `max` is the tool for the count case.
 * - The badge is positioned against its own wrapper, so it marks whatever it
 *   wraps rather than an arbitrary element elsewhere on the page. Material
 *   anchors badges inside the *icon* bounding box, so wrap the icon: wrapping a
 *   control with a large touch target anchors to that target instead, pushing
 *   the badge away from the icon by the padding around it.
 */
export const Badge = ({
  label,
  max,
  description,
  className,
  children,
  ...props
}: ReactBadgeProps) => {
  const resolvedLabel = resolveBadgeLabel({ label, max });
  const variant = resolveBadgeVariant(resolvedLabel);
  const styles = useBadgeStyle({ label, max, description, variant, className });

  return (
    <span className={styles.container} {...props}>
      {children}
      <span
        className={styles.badge}
        role={description ? 'status' : undefined}
        aria-label={description}
        aria-hidden={description ? undefined : true}
      >
        {resolvedLabel !== undefined && (
          <span className={styles.label}>{resolvedLabel}</span>
        )}
      </span>
    </span>
  );
};
