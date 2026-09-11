import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  badgeStyle,
  resolveBadgeLabel,
  resolveBadgeVariant,
  type BadgeInterface,
  type BadgeProps,
  type ClassNameComponent,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';

/**
 * @status beta
 * @category Communication
 * @devx
 * - Wrap what the badge marks: `<udx-badge [label]="3"><udx-icon … /></udx-badge>`.
 *   The wrapper provides the positioned container itself, so the anchoring
 *   never depends on a `relative` the caller has to remember.
 * - No `label` renders the small dot Material uses for an unread notification;
 *   any label renders the large pill. The variant follows from the content, so
 *   a small badge carrying a count cannot be expressed.
 * - `max` caps a count the way Material spells it: `[label]="100" [max]="99"`
 *   renders `99+`.
 * - Hiding the badge once its destination is selected is the caller's
 *   decision, so there is no input for it -- render it with `@if`.
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
@Component({
  selector: 'udx-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span [class]="styles()['container']">
      <ng-content />
      <span
        [class]="styles()['badge']"
        [attr.role]="description() ? 'status' : null"
        [attr.aria-label]="description() ?? null"
        [attr.aria-hidden]="description() ? null : true"
      >
        @if (resolvedLabel(); as text) {
          <span [class]="styles()['label']">{{ text }}</span>
        }
      </span>
    </span>
  `,
})
export class Badge {
  /** Text shown inside the badge. Omitted, it renders as the small dot. */
  readonly label = input<BadgeProps['label']>();
  /** Caps a numeric label: 100 with a max of 99 renders `99+`. */
  readonly max = input<BadgeProps['max']>();
  /** What assistive technology announces, such as `3 unread messages`. */
  readonly description = input<BadgeProps['description']>();
  /** Classes, or state-aware element classes, applied through the shared style contract. */
  readonly classes = input<string | ClassNameComponent<BadgeInterface>>();

  protected readonly resolvedLabel = computed(() =>
    resolveBadgeLabel({ label: this.label(), max: this.max() }),
  );

  protected readonly styles = createStyle(badgeStyle, () => ({
    label: this.label(),
    max: this.max(),
    description: this.description(),
    variant: resolveBadgeVariant(this.resolvedLabel()),
    className: this.classes(),
  }));
}
