import type {
  BadgeInterface,
  BadgeProps,
  ClassNameComponent,
  ElementClasses,
} from '@udixio/core';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

/**
 * Badges show notifications, counts, or status information on navigation
 * items and icons.
 *
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
export interface SvelteBadgeProps
  extends BadgeProps,
    Omit<HTMLAttributes<HTMLSpanElement>, keyof BadgeProps | 'class' | 'children'> {
  /** The icon or item the badge is anchored to. */
  children?: Snippet;
  /** Classes applied to the wrapping container, merged with the component's own classes. */
  class?: string;
  /** Static or state-aware classes for the component's internal elements, keyed by element name. */
  classes?: ElementClasses<BadgeInterface> | ClassNameComponent<BadgeInterface>;
}
