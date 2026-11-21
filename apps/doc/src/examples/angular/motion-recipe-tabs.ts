import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@udixio/ui-angular';

// Udixio Tabs move their indicator from tab to tab, and slide the new panel in from the side of the tab you chose.
// Every panel stays in the DOM, hidden while inactive, so its text is in the server HTML.
@Component({
  selector: 'docs-motion-recipe-tabs-angular',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tabs, Tab, TabGroup, TabPanels, TabPanel],
  template: `
    <div class="w-full max-w-96">
      <udx-tab-group [defaultSelectedTab]="0">
        <udx-tabs>
          <udx-tab label="Overview" />
          <udx-tab label="Specs" />
          <udx-tab label="Reviews" />
        </udx-tabs>
        <udx-tab-panels>
          <udx-tab-panel>
            <p class="p-4 text-body-medium text-on-surface-variant">A light jacket that packs into its own pocket.</p>
          </udx-tab-panel>
          <udx-tab-panel>
            <p class="p-4 text-body-medium text-on-surface-variant">Recycled nylon, 240 g, water resistant.</p>
          </udx-tab-panel>
          <udx-tab-panel>
            <p class="p-4 text-body-medium text-on-surface-variant">4.6 out of 5, from 128 reviews.</p>
          </udx-tab-panel>
        </udx-tab-panels>
      </udx-tab-group>
    </div>
  `,
})
export class MotionRecipeTabsAngular {}
