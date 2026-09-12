import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  viewChild,
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
 * - Exposes its badge element so the directive can connect the shared
 *   anime.js show/hide scale-and-fade from `@udixio/core/dom`.
 * @a11y
 * - Carries the live region and the visually hidden `description`; hides
 *   itself from assistive technology when there is no description, and when
 *   it is not `visible`.
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
      #badge
      [class]="styles()['badge']"
      [attr.role]="announced() ? 'status' : null"
      [attr.aria-hidden]="announced() ? null : true"
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
  /** Whether the badge is shown; `false` animates it out and keeps it mounted. */
  readonly visible = input<boolean>(true);
  /** Anime.js show-hide timing. */
  readonly transition = input<BadgeProps['transition']>();
  /** Classes, or state-aware element classes, applied through the shared style contract. */
  readonly classes = input<string | ClassNameComponent<BadgeInterface>>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** The host itself; the directive hands it to the shared anchor controller. */
  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  /** The badge element itself; the directive connects the show/hide transition to it. */
  readonly badgeElement = viewChild<ElementRef<HTMLElement>>('badge');

  protected readonly announced = computed(
    () => this.visible() && !!this.description(),
  );

  protected readonly resolvedLabel = computed(() =>
    resolveBadgeLabel({ label: this.label(), max: this.max() }),
  );

  protected readonly styles = createStyle(badgeStyle, () => ({
    label: this.label(),
    max: this.max(),
    description: this.description(),
    visible: this.visible(),
    transition: this.transition(),
    variant: resolveBadgeVariant(this.resolvedLabel()),
    className: this.classes(),
  }));
}
