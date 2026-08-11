import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  type OnInit,
} from '@angular/core';
import { createControllableState } from '../utils/create-controllable-state';
import { TAB_GROUP_CONTEXT, type TabGroupContext } from './tab-group-context';

/**
 * TabGroup shares selection state between a `udx-tabs` tablist and a
 * `udx-tab-panels` placed anywhere in its subtree.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Project `udx-tabs` and `udx-tab-panels`; wrap them in a `udx-tab-group`
 *   to connect them. `udx-tabs` alone (no group) is enough for a
 *   navigation-only tab list with no panels.
 * - Use `selectedTab`/`selectedTabChange` for controlled selection, or
 *   `defaultSelectedTab` (defaults to `0`) when uncontrolled.
 * @a11y
 * - Renders `display: contents` and no ARIA role itself; the `tablist`/
 *   `tab`/`tabpanel` roles live on the connected `udx-tabs`/`udx-tab`/
 *   `udx-tab-panel`.
 * @limitations
 * - No URL/hash syncing or persistence built in.
 */
@Component({
  selector: 'udx-tab-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TAB_GROUP_CONTEXT, useExisting: forwardRef(() => TabGroup) },
  ],
  host: { style: 'display: contents' },
  template: `<ng-content />`,
})
export class TabGroup implements OnInit, TabGroupContext {
  private static nextId = 0;

  /** Controlled index of the selected tab. */
  readonly selectedTab = input<number | null>();
  /** Index selected on mount when the group is uncontrolled. */
  readonly defaultSelectedTab = input<number | null>(0);
  /** Emits each accepted selection request and supports `[(selectedTab)]`. */
  readonly selectedTabChange = output<number | null>();

  private readonly tabsIdValue = `tab-group-${TabGroup.nextId++}`;
  readonly tabsId = computed(() => this.tabsIdValue);

  private readonly selectedTabState = createControllableState({
    value: this.selectedTab,
    defaultValue: this.defaultSelectedTab,
    onChange: (value) => this.selectedTabChange.emit(value),
    componentName: 'TabGroup',
    stateName: 'selectedTab',
  });
  readonly selectedIndex = this.selectedTabState.value;

  private previousSelected: number | null = null;

  readonly direction = computed(() => {
    const current = this.selectedIndex();
    const previous = this.previousSelected;
    const nextDirection =
      previous !== null && current !== null
        ? current > previous
          ? 1
          : -1
        : 0;
    this.previousSelected = current;
    return nextDirection;
  });

  ngOnInit(): void {
    this.selectedTabState.initialize();
  }

  select(index: number | null): void {
    this.selectedTabState.set(index);
  }
}
