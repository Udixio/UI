import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  resolveTabSelection,
  tabStyle,
  type ClassNameComponent,
  type Icon as IconType,
  type TabInterface,
  type TabsVariant,
} from '@udixio/core';
import { Icon } from '../icon/icon';
import { StateLayer } from '../state-layer/state-layer';
import { createStyle } from '../utils/create-style';
import { TABS_CONTEXT } from './tabs-context';

/**
 * A single tab inside a `udx-tabs` tablist; renders as a link when `href` is
 * provided, otherwise as a button.
 * @status beta
 * @parent Tabs
 * @devx
 * - `label` and `icon` are the tab's content; selection is index-based and
 *   owned by the parent `udx-tabs` -- there is no standalone `selected` input.
 * @a11y
 * - Exposes `id`, roving `tabIndex` (`0` on the selected or fallback tab,
 *   `-1` otherwise), and `aria-controls` pointing at the matching
 *   `udx-tab-panel` when the tab list is connected to a `udx-tab-panels`.
 * - `disabled` sets the native `disabled` attribute for a button tab, or
 *   `aria-disabled` and a blocked click for a link tab.
 * @limitations
 * - Horizontal layout only; there is no vertical tablist orientation.
 * - A truncated label has no built-in tooltip.
 */
@Component({
  selector: 'udx-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, Icon, StateLayer],
  host: { style: 'display: contents' },
  template: `
    @if (href() !== undefined) {
      <a
        #tabEl
        role="tab"
        [id]="domId()"
        [attr.aria-selected]="isSelected()"
        [attr.aria-controls]="panelId()"
        [attr.aria-disabled]="disabled() || null"
        [attr.tabindex]="tabIndexValue()"
        [class]="styles()['tab']"
        [attr.href]="href()"
        (click)="handleClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        #tabEl
        type="button"
        role="tab"
        [id]="domId()"
        [attr.aria-selected]="isSelected()"
        [attr.aria-controls]="panelId()"
        [disabled]="disabled()"
        [attr.tabindex]="tabIndexValue()"
        [class]="styles()['tab']"
        (click)="handleClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }

    <ng-template #content>
      <udx-state-layer
        style="transition: 0.3s"
        [className]="styles()['stateLayer']"
        [colorName]="
          variant() === 'primary' && isSelected() ? 'primary' : 'on-surface'
        "
        stateClassName="state-ripple-group-[tab]"
      />
      <span #contentEl [class]="styles()['content']">
        @if (icon()) {
          <udx-icon [icon]="icon()!" [className]="styles()['icon']" />
        }
        <span [class]="styles()['label']">{{ label() }}</span>
      </span>
    </ng-template>
  `,
})
export class Tab {
  /** Text shown for this tab. */
  readonly label = input<string>();
  /** Icon shown alongside the label. */
  readonly icon = input<IconType>();
  /** Disables pointer, keyboard, and roving-tabindex focus for this tab. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Navigation destination; switches the inner element to a native link. */
  readonly href = input<string>();
  readonly className = input<string | ClassNameComponent<TabInterface>>();

  private readonly context = inject(TABS_CONTEXT, { optional: true });

  protected readonly resolvedIndex = computed(() => this.context?.indexOf(this));
  protected readonly variant = computed<TabsVariant>(
    () => this.context?.variant() ?? 'primary',
  );
  protected readonly isSelected = computed(() =>
    resolveTabSelection({
      selectedTab: this.context?.selectedIndex() ?? null,
      index: this.resolvedIndex(),
    }),
  );
  protected readonly isFocusable = computed(
    () =>
      this.resolvedIndex() != null &&
      this.context?.focusableIndex() === this.resolvedIndex(),
  );
  protected readonly tabIndexValue = computed(() =>
    this.disabled() ? -1 : this.isSelected() || this.isFocusable() ? 0 : -1,
  );
  protected readonly domId = computed(() => {
    const tabsId = this.context?.tabsId();
    const index = this.resolvedIndex();
    return tabsId != null && index != null
      ? `tab-${tabsId}-${index}`
      : undefined;
  });
  protected readonly panelId = computed(() => {
    if (!this.context?.hasPanels()) return undefined;
    const tabsId = this.context?.tabsId();
    const index = this.resolvedIndex();
    return tabsId != null && index != null
      ? `tabpanel-${tabsId}-${index}`
      : undefined;
  });

  protected readonly styles = createStyle(tabStyle, () => ({
    label: this.label(),
    icon: this.icon(),
    variant: this.variant(),
    disabled: this.disabled(),
    index: this.resolvedIndex(),
    selectedTab: this.context?.selectedIndex() ?? null,
    tabsId: this.context?.tabsId(),
    isSelected: this.isSelected(),
    className: this.className(),
  }));

  private readonly tabElement =
    viewChild<ElementRef<HTMLElement>>('tabEl');
  private readonly contentElementRef =
    viewChild<ElementRef<HTMLSpanElement>>('contentEl');

  /** Read by the parent `udx-tabs` to focus and measure this tab. */
  get nativeElement(): HTMLElement | null {
    return this.tabElement()?.nativeElement ?? null;
  }

  /**
   * Read by the parent `udx-tabs`: the icon+label content element, which the
   * sliding indicator measures for the `primary` variant instead of the
   * full tab (`secondary` measures the tab itself).
   */
  get contentElement(): HTMLSpanElement | null {
    return this.contentElementRef()?.nativeElement ?? null;
  }

  protected handleClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    const index = this.resolvedIndex();
    if (index != null) {
      this.context?.select(index);
    }
  }
}
