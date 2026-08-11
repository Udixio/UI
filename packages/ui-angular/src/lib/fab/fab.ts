import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import {
  fabStyle,
  type ClassNameComponent,
  type FabInterface,
  type FabProps,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';

/**
 * Floating action buttons expose the primary action on a screen.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires the `label` and `icon` inputs.
 * - `type` defaults to `'button'` to prevent accidental form submissions.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * @limitations
 * - No built-in positioning; placement is handled by layout.
 * - Disabled links are inert and removed from the tab order.
 */
@Component({
  selector: 'udx-fab',
  standalone: true,
  imports: [NgTemplateOutlet, Icon, StateLayer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    <ng-template #content>
      <span [class]="styles()['touchTarget']"></span>
      <udx-state-layer
        [className]="styles()['stateLayer']"
        [colorName]="stateColor()"
        stateClassName="state-ripple-group-[fab]"
      />
      <udx-icon [icon]="icon()" [className]="styles()['icon']" />
      @if (extended()) {
        <span [class]="styles()['label']">{{ label() }}</span>
      }
    </ng-template>

    @if (href() !== undefined) {
      <a
        [hidden]="!hasAccessibleLabel()"
        [class]="styles()['fab']"
        [attr.href]="disabled() ? null : href()"
        [attr.aria-label]="extended() ? null : label()"
        [attr.aria-disabled]="disabled() || !hasAccessibleLabel() || null"
        [attr.aria-hidden]="!hasAccessibleLabel() || null"
        [attr.aria-current]="ariaCurrent()"
        [attr.aria-expanded]="ariaExpanded()"
        [attr.aria-controls]="ariaControls()"
        [attr.tabindex]="disabled() || !hasAccessibleLabel() ? -1 : tabIndex()"
        [attr.target]="target()"
        [attr.rel]="rel()"
        [attr.title]="title()"
        [attr.role]="disabled() || !hasAccessibleLabel() ? 'link' : null"
        (click)="handleClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        [hidden]="!hasAccessibleLabel()"
        [class]="styles()['fab']"
        [attr.type]="type()"
        [disabled]="disabled() || !hasAccessibleLabel()"
        [attr.aria-hidden]="!hasAccessibleLabel() || null"
        [attr.aria-label]="extended() ? null : label()"
        [attr.aria-expanded]="ariaExpanded()"
        [attr.aria-controls]="ariaControls()"
        [attr.tabindex]="tabIndex()"
        [attr.title]="title()"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }
  `,
})
export class Fab {
  readonly label = input.required<string>();
  readonly icon = input.required<FabProps['icon']>();
  readonly variant = input<FabProps['variant']>('primary');
  readonly size = input<FabProps['size']>('medium');
  readonly extended = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Classes or state-aware element classes applied through the shared style contract. */
  readonly className = input<string | ClassNameComponent<FabInterface>>();
  /** Navigation destination; switches the inner element to a native link. */
  readonly href = input<string>();
  /** Native link browsing-context target. */
  readonly target = input<string>();
  /** Native link relationship tokens. */
  readonly rel = input<string>();
  /** Tab order override applied to the inner interactive element. */
  readonly tabIndex = input<number>();
  /** Optional native advisory title; no tooltip is generated implicitly. */
  readonly title = input<string>();
  /** Native action button type. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  /** Current-item state for navigation links. */
  readonly ariaCurrent = input<
    boolean | 'page' | 'step' | 'location' | 'date' | 'time' | undefined
  >(undefined, { alias: 'aria-current' });
  /** Expanded state forwarded to the inner interactive element. */
  readonly ariaExpanded = input<boolean | undefined>(undefined, {
    alias: 'aria-expanded',
  });
  /** Id of the element controlled by this FAB. */
  readonly ariaControls = input<string | undefined>(undefined, {
    alias: 'aria-controls',
  });

  protected readonly hasAccessibleLabel = computed(
    () => this.label().trim() !== '',
  );

  protected readonly styles = createStyle(fabStyle, () => ({
    label: this.label(),
    icon: this.icon(),
    variant: this.variant(),
    size: this.size(),
    extended: this.extended(),
    disabled: this.disabled(),
    className: this.className(),
  }));

  protected readonly stateColor = () =>
    this.variant() === 'primary'
      ? 'on-primary'
      : this.variant() === 'primaryContainer'
        ? 'on-primary-container'
        : this.variant() === 'secondary'
          ? 'on-secondary'
          : this.variant() === 'secondaryContainer'
            ? 'on-secondary-container'
            : this.variant() === 'tertiary'
              ? 'on-tertiary'
              : 'on-tertiary-container';

  protected handleClick(event: Event): void {
    if (!this.disabled() && this.hasAccessibleLabel()) return;
    event.preventDefault();
    event.stopPropagation();
  }
}
