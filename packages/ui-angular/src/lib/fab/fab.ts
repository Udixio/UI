import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  fabStyle,
  type ClassNameComponent,
  type FabInterface,
  type FabProps,
  type TooltipProps,
} from '@udixio/core';
import {
  createFabLabelController,
  type FabLabelController,
} from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { Tooltip } from '../tooltip/tooltip';

/**
 * Floating action buttons expose the primary action on a screen.
 *
 * @status stable
 * @category Action
 * @devx
 * - Requires the `label` and `icon` inputs.
 * - `type` defaults to `'button'` to prevent accidental form submissions.
 * - Shows `label` in a tooltip while compact; `tooltip` overrides or disables it.
 * @a11y
 * - Uses native button/link semantics, a stable accessible name, a 48px target, and visible focus.
 * - A compact fab names its icon in a tooltip on hover and focus, as Material 3 requires; it only
 *   describes the target when its text says something the accessible name does not.
 * @limitations
 * - No built-in positioning; placement is handled by layout.
 * - Disabled links are inert and removed from the tab order.
 */
@Component({
  selector: 'udx-fab',
  standalone: true,
  imports: [NgTemplateOutlet, Icon, StateLayer, Tooltip],
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
      <span
        #labelEl
        [class]="styles()['label']"
        [attr.aria-hidden]="extended() ? null : true"
        [style]="initialLabelStyle"
        >{{ label() }}</span
      >
    </ng-template>

    @if (href() !== undefined) {
      <a
        #interactiveElement
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
        #interactiveElement
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

    @if (tooltipText(); as text) {
      @if (interactiveElement(); as target) {
        <udx-tooltip
          [target]="target"
          [text]="text"
          [trigger]="disabled() ? null : tooltipTriggers"
          [describeTarget]="text !== label()"
        />
      }
    }
  `,
})
export class Fab {
  readonly label = input.required<string>();
  readonly icon = input.required<FabProps['icon']>();
  readonly variant = input<FabProps['variant']>('primary');
  readonly size = input<FabProps['size']>('medium');
  readonly extended = input(false, { transform: booleanAttribute });
  /**
   * Visual tooltip text, shown while the fab is compact. Defaults to `label`;
   * set to `false` to hide it.
   */
  readonly tooltip = input<FabProps['tooltip']>();
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

  protected readonly interactiveElement =
    viewChild<ElementRef<HTMLButtonElement | HTMLAnchorElement>>(
      'interactiveElement',
    );
  protected readonly tooltipTriggers: NonNullable<TooltipProps['trigger']> = [
    'hover',
    'focus',
  ];

  // Material 3 asks a fab to name its icon in a tooltip on hover; an extended
  // one already shows that text, so only a compact fab gets one.
  protected readonly tooltipText = computed(() =>
    this.extended() || this.tooltip() === false
      ? undefined
      : (this.tooltip() ?? this.title() ?? this.label()),
  );

  private readonly labelEl = viewChild<ElementRef<HTMLElement>>('labelEl');
  private wiredLabelEl?: HTMLElement;
  private labelController?: FabLabelController;

  // Captured once, from the `extended` value this component actually mounted
  // with, and never updated afterward: the controller owns the label's width
  // and opacity from its first call onward, and this only exists so the first
  // rendered markup is already correct before the effects below run. A
  // computed() re-evaluated on every extended() change would race the
  // controller, jumping the width straight to its target before Anime.js
  // Layout can diff the two, so every transition would silently become a
  // snap.
  protected readonly initialLabelStyle: Record<string, string>;

  constructor() {
    // The label is always mounted; the shared `@udixio/core/dom` controller
    // animates its width and opacity, so this component never has to
    // coordinate an exit-animation-before-removal sequence with `@if`.
    const destroyRef = inject(DestroyRef);

    this.initialLabelStyle = this.extended()
      ? { width: 'auto', opacity: '1' }
      : { width: '0px', opacity: '0' };

    afterRenderEffect(() => {
      const labelEl = this.labelEl()?.nativeElement;
      if (!labelEl) return;

      // Guarding on the *native element* -- not on the query signal firing --
      // is what keeps this effect from tearing down and recreating the
      // controller on every render: that would reset its "first apply is
      // instant" bookkeeping, so every extend/collapse would be replayed as a
      // fresh mount and silently never animate.
      if (labelEl === this.wiredLabelEl) return;

      this.labelController?.destroy();
      this.wiredLabelEl = labelEl;
      this.labelController = createFabLabelController({
        label: labelEl,
        extended: () => this.extended(),
      });
    });

    destroyRef.onDestroy(() => {
      this.labelController?.destroy();
    });

    // The controller ignores a call that does not change `extended`, so the
    // one this fires on mount is a no-op and only later transitions animate.
    afterRenderEffect(() => {
      this.extended();
      this.labelController?.update();
    });
  }

  protected readonly styles = createStyle(fabStyle, () => ({
    label: this.label(),
    icon: this.icon(),
    variant: this.variant(),
    size: this.size(),
    tooltip: this.tooltip(),
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
