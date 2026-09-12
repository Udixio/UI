import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  badgeStyle,
  resolveBadgeLabel,
  resolveBadgeVariant,
  type ComponentClassName,
  type BadgeInterface,
  type BadgeProps,
} from '@udixio/core';
import {
  createBadgeTransitionController,
  type BadgeTransitionController,
} from '@udixio/core/dom';
import { createUseStyle } from '../utils/create-use-style';

export type ReactBadgeProps = BadgeProps &
  ComponentClassName<BadgeInterface> & {
    /** The icon or item the badge is anchored to. */
    children?: ReactNode;
  } & Omit<ComponentProps<'span'>, 'className' | 'children'>;

export const useBadgeStyle = createUseStyle(badgeStyle);

const HIDDEN_STYLE = { visibility: 'hidden', opacity: 0 } as const;

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
 *   decision: set `visible={false}` rather than unmounting it, so it can
 *   animate out. The show/hide scale-and-fade is implemented once with
 *   anime.js in `@udixio/core/dom`; `transition` tunes it, and reduced motion
 *   skips it.
 * @a11y
 * - `description` is what a screen reader announces. Give it the meaning, not
 *   the number: `3 unread messages`, not `3`. It is rendered as visually
 *   hidden text inside a live region, so a changing count announces the whole
 *   sentence rather than the bare digit, and the visible number is hidden from
 *   assistive technology so it is not read twice.
 * - Without a `description` the badge is hidden from assistive technology
 *   rather than announced as a bare digit or as nothing at all; so is a
 *   badge that is not `visible`.
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
  visible = true,
  transition,
  className,
  children,
  ...props
}: ReactBadgeProps) => {
  const resolvedLabel = resolveBadgeLabel({ label, max });
  const variant = resolveBadgeVariant(resolvedLabel);
  const styles = useBadgeStyle({
    label,
    max,
    description,
    visible,
    transition,
    variant,
    className,
  });
  const announced = visible && !!description;

  const [badge, setBadge] = useState<HTMLSpanElement | null>(null);
  const controllerRef = useRef<BadgeTransitionController | null>(null);
  // Captured once so first paint already matches `visible`; later changes go
  // through the controller, and a re-rendered style would cut its exit short.
  const initiallyHidden = useRef(!visible).current;

  useEffect(() => {
    if (!badge) return undefined;
    const controller = createBadgeTransitionController({
      element: badge,
      transition,
    });
    controllerRef.current = controller;
    controller.setVisible(visible, true);
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge, transition?.duration, transition?.ease]);

  useEffect(() => {
    controllerRef.current?.setVisible(visible);
  }, [visible]);

  return (
    <span className={styles.container} {...props}>
      {children}
      <span
        ref={setBadge}
        className={styles.badge}
        style={initiallyHidden ? HIDDEN_STYLE : undefined}
        role={announced ? 'status' : undefined}
        aria-hidden={announced ? undefined : true}
      >
        {resolvedLabel !== undefined && (
          <span className={styles.label} aria-hidden="true">
            {resolvedLabel}
          </span>
        )}
        {description && (
          <span className={styles.announcement}>{description}</span>
        )}
      </span>
    </span>
  );
};
