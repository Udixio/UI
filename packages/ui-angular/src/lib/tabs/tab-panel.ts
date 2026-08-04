import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  tabPanelStyle,
  type ClassNameComponent,
  type TabPanelInterface,
} from '@udixio/core';
import { animateTabPanelEnter } from '@udixio/core/dom';
import { createStyle } from '../utils/create-style';
import { TAB_GROUP_CONTEXT } from './tab-group-context';
import { TAB_PANELS_CONTEXT } from './tab-panels-context';

/**
 * TabPanel holds the content for a single tab. `lib-tab-panels` keeps every
 * panel's Angular component instance and state alive and hides the inactive
 * ones with the native `hidden` attribute, unlike the React adapter which
 * only ever mounts the active panel -- Angular content projection has no
 * cheap equivalent to conditionally mounting projected children, so this is
 * an intentional, documented platform difference. Both remove inactive
 * panels from the accessibility tree and the tab order identically.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Must be rendered inside a `lib-tab-panels`, itself inside a `lib-tab-group`.
 * @a11y
 * - Exposes `role="tabpanel"`, an `id`/`aria-labelledby` pair matching the
 *   connected `lib-tab`, and `tabIndex={0}` while active so keyboard users
 *   can move focus into the panel content.
 * @limitations
 * - Unlike React, scroll position and focus inside an inactive panel are
 *   preserved (its component instance stays alive, only hidden) -- do not
 *   rely on either behavior for cross-framework parity.
 */
@Component({
  selector: 'lib-tab-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: block',
    role: 'tabpanel',
    '[id]': 'domId()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.tabindex]': 'isActive() ? 0 : null',
    '[hidden]': '!isActive()',
    '[class]': 'styles()["tabPanel"]',
  },
  template: `<ng-content />`,
})
export class TabPanel {
  readonly className = input<string | ClassNameComponent<TabPanelInterface>>();

  private readonly groupContext = inject(TAB_GROUP_CONTEXT, { optional: true });
  private readonly panelsContext = inject(TAB_PANELS_CONTEXT, {
    optional: true,
  });
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly resolvedIndex = computed(() =>
    this.panelsContext?.indexOf(this),
  );
  protected readonly isActive = computed(() => {
    const index = this.resolvedIndex();
    return index != null && this.groupContext?.selectedIndex() === index;
  });
  protected readonly domId = computed(() => {
    const tabsId = this.groupContext?.tabsId();
    const index = this.resolvedIndex();
    return tabsId != null && index != null
      ? `tabpanel-${tabsId}-${index}`
      : undefined;
  });
  protected readonly labelledBy = computed(() => {
    const tabsId = this.groupContext?.tabsId();
    const index = this.resolvedIndex();
    return tabsId != null && index != null ? `tab-${tabsId}-${index}` : undefined;
  });

  protected readonly styles = createStyle(tabPanelStyle, () => ({
    index: this.resolvedIndex(),
    tabsId: this.groupContext?.tabsId(),
    className: this.className(),
  }));

  private animation?: ReturnType<typeof animateTabPanelEnter>;

  constructor() {
    afterRenderEffect(() => {
      if (!this.isActive()) return;
      const direction = this.groupContext?.direction() ?? 0;
      this.animation?.stop();
      this.animation = animateTabPanelEnter({
        panel: this.elementRef.nativeElement,
        direction,
      });
    });
  }
}
