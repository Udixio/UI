import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
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
 * The badge element a `Badge` directive owns.
 *
 * @status beta
 * @category Communication
 * @devx
 * - Building block for the `[udxBadge]` directive, which instantiates it and
 *   places it inside the marked element; not meant to be placed in a template
 *   directly.
 * - Renders the dot or the pill from the same shared contract React renders
 *   from, so the DOM the two frameworks produce is identical.
 * @a11y
 * - Carries the live region and the visually hidden `description`; hides
 *   itself from assistive technology when there is no description.
 * @limitations
 * - Positions itself against its parent, and relies on the directive to have
 *   made that parent a containing block.
 */
@Component({
  selector: 'udx-badge-surface',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <span
      [class]="styles()['badge']"
      [attr.role]="description() ? 'status' : null"
      [attr.aria-hidden]="description() ? null : true"
    >
      @if (resolvedLabel(); as text) {
        <span [class]="styles()['label']" aria-hidden="true">{{ text }}</span>
      }
      @if (description(); as announcement) {
        <span [class]="styles()['announcement']">{{ announcement }}</span>
      }
    </span>
  `,
})
export class BadgeSurface {
  /** Text shown inside the badge. Omitted, it renders as the small dot. */
  readonly label = input<BadgeProps['label']>();
  /** Caps a numeric label: 100 with a max of 99 renders `99+`. */
  readonly max = input<BadgeProps['max']>();
  /** What assistive technology announces, such as `3 unread messages`. */
  readonly description = input<BadgeProps['description']>();
  /** Classes, or state-aware element classes, applied through the shared style contract. */
  readonly classes = input<string | ClassNameComponent<BadgeInterface>>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** The host itself; the directive hands it to the shared anchor controller. */
  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

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
