import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  navigationRailItemStyle,
  resolveNavigationRailItemSelection,
  type ClassNameComponent,
  type Icon as IconType,
  type NavigationRailItemInterface,
} from '@udixio/core';
import {
  createNavigationRailItemLabelController,
  type NavigationRailItemLabelController,
} from '@udixio/core/dom';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createStyle } from '../utils/create-style';
import { NAVIGATION_RAIL_CONTEXT } from './navigation-rail-context';

/**
 * A single destination inside a `lib-navigation-rail`; renders as a link
 * when `href` is provided, otherwise as a button.
 * @status beta
 * @parent NavigationRail
 * @devx
 * - Selection is index-based and resolved from the parent rail; standalone
 *   usage falls back to `selected`.
 * - An item placed after a `lib-navigation-rail-section` only renders while
 *   the rail is extended.
 * - The label reveal (width/height + opacity, on `extended` changes) is
 *   driven by a shared `@udixio/core/dom` Motion controller, the same one
 *   the React adapter uses.
 * @a11y
 * - Exposes `aria-current="page"` when selected, since the rail is a
 *   navigation landmark rather than a tabbed panel switcher.
 * @limitations
 * - No arrow-key navigation between items; relies on the native sequential
 *   tab order.
 */
@Component({
  selector: 'lib-navigation-rail-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, Icon, StateLayer],
  host: { style: 'display: contents' },
  template: `
    @if (!hidden()) {
      @if (href() !== undefined) {
        <a
          [class]="styles()['navigationRailItem']"
          [attr.href]="href()"
          [attr.aria-current]="isSelected() ? 'page' : null"
          style="transition: 0.3s"
          (click)="handleClick()"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </a>
      } @else {
        <button
          type="button"
          [class]="styles()['navigationRailItem']"
          [attr.aria-current]="isSelected() ? 'page' : null"
          style="transition: 0.3s"
          (click)="handleClick()"
        >
          <ng-container [ngTemplateOutlet]="content" />
        </button>
      }
    }

    <ng-template #content>
      <div [class]="styles()['container']" [style.transition]="containerTransition()">
        <lib-state-layer
          [className]="styles()['stateLayer']"
          [colorName]="isSelected() ? 'on-secondary-container' : 'on-surface'"
          stateClassName="state-ripple-group-[navigation-rail-item]"
        />
        @if (icon()) {
          <lib-icon
            [icon]="(isSelected() ? iconSelected() : icon())!"
            [className]="styles()['icon']"
          />
        }
        <span
          #horizontalLabel
          [class]="styles()['label']"
          [attr.aria-hidden]="resolvedVariant() !== 'horizontal'"
          [style]="initialHorizontalStyle"
          >{{ label() }}</span
        >
      </div>
      <span
        #verticalLabel
        [class]="styles()['label']"
        [attr.aria-hidden]="resolvedVariant() !== 'vertical'"
        [style]="initialVerticalStyle"
        >{{ label() }}</span
      >
    </ng-template>
  `,
})
export class NavigationRailItem {
  /** Text shown alongside (or as the accessible name for) the icon. */
  readonly label = input<string>();
  /** Icon shown while the item is not selected. */
  readonly icon = input<IconType>();
  /** Icon shown while the item is selected. */
  readonly iconSelected = input<IconType>();
  /** Controlled selected state, used when no parent drives the selection. */
  readonly selected = input(false, { transform: booleanAttribute });
  /** Navigation destination; switches the inner element to a native link. */
  readonly href = input<string>();
  readonly className = input<
    string | ClassNameComponent<NavigationRailItemInterface>
  >();

  private readonly context = inject(NAVIGATION_RAIL_CONTEXT, {
    optional: true,
  });
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly resolvedIndex = computed(() =>
    this.context?.indexOf(this),
  );
  protected readonly resolvedVariant = computed<'vertical' | 'horizontal'>(
    () => (this.context?.isExtended() ? 'horizontal' : 'vertical'),
  );
  protected readonly isSelected = computed(() =>
    resolveNavigationRailItemSelection({
      selectedItem: this.context?.selectedIndex() ?? null,
      index: this.resolvedIndex(),
      selected: this.selected(),
    }),
  );
  protected readonly hidden = computed(
    () =>
      (this.context?.hasPrecedingSection(this) ?? false) &&
      !(this.context?.isExtended() ?? true),
  );
  // Staggers the container's own `gap` transition behind the label reveal,
  // matching the React adapter's timing exactly.
  protected readonly containerTransition = computed(() =>
    this.resolvedVariant() === 'horizontal'
      ? '0.3s, gap 0.15s 0.15s'
      : '0.3s, gap 0.1s 0.2s',
  );

  protected readonly styles = createStyle(navigationRailItemStyle, () => ({
    label: this.label(),
    icon: this.icon()!,
    iconSelected: this.iconSelected()!,
    selected: this.selected(),
    variant: this.resolvedVariant(),
    index: this.resolvedIndex(),
    selectedItem: this.context?.selectedIndex() ?? null,
    isExtended: this.context?.isExtended(),
    extendedOnly: this.context?.hasPrecedingSection(this),
    isSelected: this.isSelected(),
    className: this.className(),
  }));

  /** @internal Read by the parent rail to order this item relative to sections. */
  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  private readonly horizontalLabel =
    viewChild<ElementRef<HTMLElement>>('horizontalLabel');
  private readonly verticalLabel =
    viewChild<ElementRef<HTMLElement>>('verticalLabel');
  private wiredHorizontalEl?: HTMLElement;
  private wiredVerticalEl?: HTMLElement;
  private horizontalController?: NavigationRailItemLabelController;
  private verticalController?: NavigationRailItemLabelController;

  // Captured once, from whichever variant this component actually mounted
  // with, and never updated afterward -- it exists only so server-rendered/
  // first-paint markup is already correct before hydration, instead of both
  // labels being visible until afterRenderEffect runs. If this were a
  // computed() re-evaluated on every resolvedVariant() change, it would
  // race the Motion controller: Angular would jump the style straight to
  // the new target before the effect's animate() call ever reads a "from"
  // value to animate from, i.e. every transition would silently become a
  // no-op snap.
  protected readonly initialHorizontalStyle: Record<string, string>;
  protected readonly initialVerticalStyle: Record<string, string>;

  constructor() {
    // The label is always mounted in both positions (horizontal, inside the
    // container; vertical, after it); the shared `@udixio/core/dom`
    // controller animates whichever one matches the current variant, so
    // this component never has to coordinate an exit-animation-before-
    // removal sequence with `@if`.
    const destroyRef = inject(DestroyRef);

    const initialVariant = this.resolvedVariant();
    this.initialHorizontalStyle =
      initialVariant === 'horizontal'
        ? { overflow: 'hidden' }
        : { width: '0px', opacity: '0', overflow: 'hidden' };
    this.initialVerticalStyle =
      initialVariant === 'vertical'
        ? { overflow: 'hidden' }
        : { height: '0px', opacity: '0', overflow: 'hidden' };

    afterRenderEffect(() => {
      const horizontalEl = this.horizontalLabel()?.nativeElement;
      const verticalEl = this.verticalLabel()?.nativeElement;
      if (!horizontalEl || !verticalEl) return;

      // The viewChild query signal can refresh its own wrapper identity on
      // every render without the underlying DOM node actually changing
      // (this item has no preceding section, no `@if` toggles at all, and
      // it still happened). Guarding on the *native element* -- not the
      // signal firing -- is what keeps this effect from tearing down and
      // recreating both controllers on every single render: that reset
      // their "first apply is instant" bookkeeping each time, so every
      // extend/collapse was replayed as a fresh mount and silently never
      // animated.
      if (
        horizontalEl === this.wiredHorizontalEl &&
        verticalEl === this.wiredVerticalEl
      ) {
        return;
      }
      this.horizontalController?.destroy();
      this.verticalController?.destroy();

      this.wiredHorizontalEl = horizontalEl;
      this.wiredVerticalEl = verticalEl;
      this.horizontalController = createNavigationRailItemLabelController({
        label: horizontalEl,
        axis: () => 'horizontal',
        visible: () => this.resolvedVariant() === 'horizontal',
      });
      this.verticalController = createNavigationRailItemLabelController({
        label: verticalEl,
        axis: () => 'vertical',
        visible: () => this.resolvedVariant() === 'vertical',
      });
    });

    destroyRef.onDestroy(() => {
      this.horizontalController?.destroy();
      this.verticalController?.destroy();
    });

    afterRenderEffect(() => {
      this.resolvedVariant();
      this.horizontalController?.update();
      this.verticalController?.update();
    });
  }

  protected handleClick(): void {
    const index = this.resolvedIndex();
    if (index != null) {
      this.context?.select(index);
    }
  }
}
