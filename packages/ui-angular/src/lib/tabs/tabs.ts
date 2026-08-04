import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  output,
  viewChild,
  type OnInit,
} from '@angular/core';
import {
  getNextTabIndex,
  tabsStyle,
  type ClassNameComponent,
  type TabsInterface,
  type TabsVariant,
} from '@udixio/core';
import {
  createTabsIndicatorController,
  type TabsIndicatorController,
} from '@udixio/core/dom';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import { TAB_GROUP_CONTEXT } from './tab-group-context';
import { TABS_CONTEXT, type TabsContext } from './tabs-context';
import { Tab } from './tab';

/** Payload emitted when a tab becomes the selected one. */
export interface TabSelectedEvent {
  index: number;
  label?: string;
  icon?: unknown;
}

/**
 * Tabs organize content across different screens and views.
 * @status beta
 * @category Navigation
 * @devx
 * - Project `lib-tab` children; other content is ignored.
 * - Use `selectedTab`/`selectedTabChange` for controlled selection, or
 *   `defaultSelectedTab` (defaults to `0`) when uncontrolled.
 * - Wrapping in a `lib-tab-group` shares its selection automatically; do not
 *   also bind `selectedTab` directly on `lib-tabs` in that case, or the two
 *   owners fight over selection.
 * @a11y
 * - `role="tablist"` with a shared sliding indicator driven by a
 *   `@udixio/core/dom` Motion controller, the same one the React adapter
 *   uses.
 * - Roving `tabIndex`: ArrowLeft/ArrowRight move focus and selection between
 *   enabled tabs (wrapping), Home/End jump to the first/last enabled tab.
 * @limitations
 * - Horizontal orientation only.
 */
@Component({
  selector: 'lib-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TABS_CONTEXT, useExisting: forwardRef(() => Tabs) },
  ],
  host: { style: 'display: contents' },
  template: `
    <div
      #root
      role="tablist"
      [class]="styles()['tabs']"
      (keydown)="handleKeyDown($event)"
    >
      <ng-content select="lib-tab" />
      <span #indicator [class]="styles()['indicator']"></span>
    </div>
  `,
})
export class Tabs implements OnInit, TabsContext {
  private static nextId = 0;

  /** Visual style: `primary` (icon above label) or `secondary` (icon beside label). */
  readonly variant = input<TabsVariant>('primary');
  /** Enables horizontal scrolling and auto-centering of the selected tab. */
  readonly scrollable = input(false, { transform: booleanAttribute });
  /** Controlled index of the selected tab. */
  readonly selectedTab = input<number | null>();
  /** Index selected on mount when the tab list is uncontrolled. */
  readonly defaultSelectedTab = input<number | null>(0);
  readonly className = input<string | ClassNameComponent<TabsInterface>>();

  /** Emits each accepted selection request and supports `[(selectedTab)]`. */
  readonly selectedTabChange = output<number | null>();
  /** Emits once whenever the resolved selection settles on a given tab. */
  readonly tabSelected = output<TabSelectedEvent>();

  private readonly groupContext = inject(TAB_GROUP_CONTEXT, {
    optional: true,
  });
  readonly hasPanels = computed(() => this.groupContext != null);

  private readonly controlledValue = computed(() =>
    this.selectedTab() !== undefined
      ? this.selectedTab()
      : this.groupContext?.selectedIndex(),
  );

  private readonly selectedTabState = createControllableState({
    value: this.controlledValue,
    defaultValue: this.defaultSelectedTab,
    onChange: (next) => {
      if (this.groupContext && this.selectedTab() === undefined) {
        this.groupContext.select(next);
      } else {
        this.selectedTabChange.emit(next);
      }
    },
    componentName: 'Tabs',
    stateName: 'selectedTab',
  });
  readonly selectedIndex = this.selectedTabState.value;

  private readonly tabsIdValue = `tabs-${Tabs.nextId++}`;
  readonly tabsId = computed(
    () => this.groupContext?.tabsId() ?? this.tabsIdValue,
  );

  private readonly tabs = contentChildren(Tab);

  readonly focusableIndex = computed(() => {
    const items = this.tabs();
    const selected = this.selectedIndex();
    if (selected != null && items[selected] && !items[selected].disabled()) {
      return selected;
    }
    return items.findIndex((tab) => !tab.disabled());
  });

  protected readonly styles = createStyle(tabsStyle, () => ({
    variant: this.variant(),
    scrollable: this.scrollable(),
    selectedTab: this.selectedTab(),
    defaultSelectedTab: this.defaultSelectedTab(),
    selectedIndex: this.selectedIndex(),
    className: this.className(),
  }));

  private readonly root = viewChild<ElementRef<HTMLElement>>('root');
  private readonly indicator = viewChild<ElementRef<HTMLElement>>('indicator');
  private indicatorController?: TabsIndicatorController;
  private lastEmittedIndex: number | null = null;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const root = this.root()?.nativeElement;
      const indicator = this.indicator()?.nativeElement;
      if (!root || !indicator) return;

      const controller = createTabsIndicatorController({
        root,
        indicator,
        // The `primary` variant's indicator hugs the icon+label content
        // (matching the tab's own intrinsic width), while `secondary` spans
        // the full tab -- mirroring the original single-underline-per-tab
        // implementation, where the content element was only a positioned
        // ancestor for `primary`.
        selectedTab: () => {
          const index = this.selectedIndex();
          if (index == null) return null;
          const tab = this.tabs()[index];
          if (!tab) return null;
          return this.variant() === 'primary'
            ? (tab.contentElement ?? tab.nativeElement)
            : tab.nativeElement;
        },
      });
      this.indicatorController = controller;

      onCleanup(() => {
        controller.destroy();
        if (this.indicatorController === controller) {
          this.indicatorController = undefined;
        }
      });
    });

    afterRenderEffect(() => {
      this.selectedIndex();
      this.variant();
      this.tabs();
      this.indicatorController?.update();
    });

    afterRenderEffect(() => {
      const idx = this.selectedIndex();
      const items = this.tabs();
      if (idx == null || idx === this.lastEmittedIndex) return;
      const tab = items[idx];
      if (!tab) return;
      this.lastEmittedIndex = idx;
      this.tabSelected.emit({ index: idx, label: tab.label(), icon: tab.icon() });
    });
  }

  ngOnInit(): void {
    this.selectedTabState.initialize();
  }

  select(index: number): void {
    this.selectedTabState.set(index);
  }

  indexOf(tab: object): number | undefined {
    const idx = this.tabs().indexOf(tab as Tab);
    return idx === -1 ? undefined : idx;
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (
      key !== 'ArrowLeft' &&
      key !== 'ArrowRight' &&
      key !== 'Home' &&
      key !== 'End'
    ) {
      return;
    }
    const items = this.tabs();
    if (!items.length) return;
    const currentIndex = this.focusableIndex();
    if (currentIndex < 0) return;

    event.preventDefault();
    const disabled = items.map((tab) => tab.disabled());
    const nextIndex = getNextTabIndex({ key, currentIndex, disabled });
    this.select(nextIndex);
    items[nextIndex]?.nativeElement?.focus();
  }
}
