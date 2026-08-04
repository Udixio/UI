import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  contentChildren,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  tabPanelsStyle,
  type ClassNameComponent,
  type TabPanelsInterface,
} from '@udixio/core';
import { createStyle } from '../utils/create-style';
import { TAB_GROUP_CONTEXT } from './tab-group-context';
import { TAB_PANELS_CONTEXT, type TabPanelsContext } from './tab-panels-context';
import { TabPanel } from './tab-panel';

/**
 * TabPanels hosts every projected `lib-tab-panel`; each panel resolves its
 * own active/hidden state from the shared `lib-tab-group` selection.
 * @status beta
 * @parent Tabs
 * @category Navigation
 * @devx
 * - Requires a `lib-tab-group` ancestor; otherwise it warns and every panel
 *   stays hidden.
 * @a11y
 * - Renders a plain wrapper `div`; the `tabpanel` role and its `id`/
 *   `aria-labelledby` pair live on the connected `lib-tab-panel`.
 * @limitations
 * - Unlike React, every projected `lib-tab-panel` keeps its component
 *   instance alive; inactive panels are hidden with the native `hidden`
 *   attribute instead of being unmounted.
 */
@Component({
  selector: 'lib-tab-panels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: TAB_PANELS_CONTEXT, useExisting: forwardRef(() => TabPanels) },
  ],
  host: { style: 'display: contents' },
  template: `
    <div [class]="styles()['tabPanels']">
      <ng-content select="lib-tab-panel" />
    </div>
  `,
})
export class TabPanels implements TabPanelsContext {
  readonly className = input<
    string | ClassNameComponent<TabPanelsInterface>
  >();

  private readonly groupContext = inject(TAB_GROUP_CONTEXT, {
    optional: true,
  });
  private readonly panels = contentChildren(TabPanel);
  private warned = false;

  protected readonly styles = createStyle(tabPanelsStyle, () => ({
    className: this.className(),
  }));

  constructor() {
    afterRenderEffect(() => {
      if (this.groupContext || this.warned) return;
      this.warned = true;
      console.warn('lib-tab-panels must be used within a lib-tab-group');
    });
  }

  indexOf(panel: object): number | undefined {
    const idx = this.panels().indexOf(panel as TabPanel);
    return idx === -1 ? undefined : idx;
  }
}
