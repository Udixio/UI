import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  contentChildren,
  forwardRef,
  input,
  output,
  type OnInit,
} from '@angular/core';
import {
  getNextNavigationRailExtended,
  navigationRailStyle,
  type ClassNameComponent,
  type Icon,
  type NavigationRailInterface,
  type NavigationRailMenuState,
  type NavigationRailProps,
} from '@udixio/core';
import { iClose } from '@udixio/icons-rounded-400/close';
import { iMenu } from '@udixio/icons-rounded-400/menu';
import { IconButton } from '../icon-button/icon-button';
import { createControllableState } from '../utils/create-controllable-state';
import { createStyle } from '../utils/create-style';
import {
  NAVIGATION_RAIL_CONTEXT,
  type NavigationRailContext,
} from './navigation-rail-context';
import { NavigationRailItem } from './navigation-rail-item';
import { NavigationRailSection } from './navigation-rail-section';

/** Payload emitted when an item becomes the selected one. */
export interface NavigationRailItemSelectedEvent {
  index: number;
  label?: string;
  icon?: Icon;
}

const DEFAULT_MENU: { closed: NavigationRailMenuState; opened: NavigationRailMenuState } = {
  closed: { icon: iMenu, label: 'Open menu' },
  opened: { icon: iClose, label: 'Close menu' },
};

/**
 * Navigation rails let people switch between UI views on mid-sized devices.
 * @status beta
 * @category Navigation
 * @devx
 * - Project `lib-navigation-rail-item`, `lib-navigation-rail-section`, and
 *   a `lib-fab` as children; the FAB is hoisted into the header.
 * - `footer` content is projected via `<div footer>`/an element with a
 *   `footer` attribute, pinned below the item list.
 * - Selection is index-based; use `selectedItem`/`selectedItemChange` for
 *   controlled usage, or `defaultSelectedItem` uncontrolled.
 * @a11y
 * - The menu toggle button exposes its open/closed label via `menu.opened`/
 *   `menu.closed`.
 * @limitations
 * - Keyboard navigation/roving tabindex is not implemented.
 * - Angular's `selectedItem`/`selectedItemChange` follow this repository's
 *   output-naming convention; React instead exposes a raw
 *   `setSelectedItem` dispatcher (an intentional platform difference, not a
 *   parity gap).
 */
@Component({
  selector: 'lib-navigation-rail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconButton],
  providers: [
    {
      provide: NAVIGATION_RAIL_CONTEXT,
      useExisting: forwardRef(() => NavigationRail),
    },
  ],
  host: { style: 'display: contents' },
  template: `
    <div [class]="styles()['navigationRail']" style="transition: 0.3s">
      <div [class]="styles()['header']">
        <lib-icon-button
          [label]="isExtended() ? menu().opened.label : menu().closed.label"
          [icon]="isExtended() ? menu().opened.icon : menu().closed.icon"
          [className]="styles()['menuIcon']"
          (click)="toggleExtended()"
        />
        <div class="mx-5 [&_.fab]:!shadow-none">
          <ng-content select="lib-fab" />
        </div>
      </div>

      <div [class]="styles()['segments']">
        <ng-content
          select="lib-navigation-rail-item, lib-navigation-rail-section"
        />
      </div>

      <div [class]="styles()['footer']">
        <ng-content select="[footer]" />
      </div>
    </div>
  `,
})
export class NavigationRail implements OnInit, NavigationRailContext {
  readonly variant = input<NavigationRailProps['variant']>('standard');
  readonly alignment = input<NavigationRailProps['alignment']>('top');
  readonly menu = input<{
    closed: NavigationRailMenuState;
    opened: NavigationRailMenuState;
  }>(DEFAULT_MENU);
  /** Controlled extended state of the rail. */
  readonly extended = input<boolean>();
  /** Initial extended state when uncontrolled. */
  readonly defaultExtended = input(false);
  /** Controlled index of the selected item. */
  readonly selectedItem = input<number | null>();
  /** Initial selected index when uncontrolled. */
  readonly defaultSelectedItem = input<number | null>(null);
  readonly className = input<
    string | ClassNameComponent<NavigationRailInterface>
  >();

  /** Emits each accepted extended-state request and supports `[(extended)]`. */
  readonly extendedChange = output<boolean>();
  /** Emits each accepted selection request and supports `[(selectedItem)]`. */
  readonly selectedItemChange = output<number | null>();
  /** Emits once whenever the resolved selection settles on a given item. */
  readonly itemSelected = output<NavigationRailItemSelectedEvent>();

  private readonly extendedState = createControllableState({
    value: this.extended,
    defaultValue: this.defaultExtended,
    onChange: (value) => this.extendedChange.emit(value),
    componentName: 'NavigationRail',
    stateName: 'extended',
  });
  readonly isExtended = this.extendedState.value;

  private readonly selectedItemState = createControllableState({
    value: this.selectedItem,
    defaultValue: this.defaultSelectedItem,
    onChange: (value) => this.selectedItemChange.emit(value),
    componentName: 'NavigationRail',
    stateName: 'selectedItem',
  });
  readonly selectedIndex = this.selectedItemState.value;

  private readonly items = contentChildren(NavigationRailItem);
  private readonly sections = contentChildren(NavigationRailSection);

  protected readonly styles = createStyle(navigationRailStyle, () => ({
    variant: this.variant(),
    alignment: this.alignment(),
    menu: this.menu(),
    selectedItem: this.selectedItem(),
    extended: this.extended(),
    defaultExtended: this.defaultExtended(),
    onExtendedChange: undefined,
    isExtended: this.isExtended(),
    selectedIndex: this.selectedIndex(),
    className: this.className(),
  }));

  private lastEmittedIndex: number | null = null;

  constructor() {
    afterRenderEffect(() => {
      const idx = this.selectedIndex();
      const items = this.items();
      if (idx == null || idx === this.lastEmittedIndex) return;
      const item = items[idx];
      if (!item) return;
      this.lastEmittedIndex = idx;
      this.itemSelected.emit({
        index: idx,
        label: item.label(),
        icon: item.icon(),
      });
    });
  }

  ngOnInit(): void {
    this.extendedState.initialize();
    this.selectedItemState.initialize();
  }

  protected toggleExtended(): void {
    this.extendedState.set(getNextNavigationRailExtended(this.isExtended()));
  }

  select(index: number): void {
    this.selectedItemState.set(index);
  }

  indexOf(item: object): number | undefined {
    const idx = this.items().indexOf(item as NavigationRailItem);
    return idx === -1 ? undefined : idx;
  }

  hasPrecedingSection(item: object): boolean {
    const itemEl = (item as NavigationRailItem).nativeElement;
    return this.sections().some((section) => {
      const position = section.nativeElement.compareDocumentPosition(itemEl);
      return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
  }
}
