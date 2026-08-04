import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tabs-panels-angular',
  standalone: true,
  imports: [Tabs, Tab, TabGroup, TabPanels, TabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-tab-group [defaultSelectedTab]="0">
      <lib-tabs>
        <lib-tab label="Profile" />
        <lib-tab label="Settings" />
        <lib-tab label="Notifications" />
      </lib-tabs>
      <lib-tab-panels>
        <lib-tab-panel>
          <div class="p-4">
            <h3 class="text-title-medium">Profile</h3>
            <p class="text-body-medium text-on-surface-variant">
              This is the profile panel content.
            </p>
          </div>
        </lib-tab-panel>
        <lib-tab-panel>
          <div class="p-4">
            <h3 class="text-title-medium">Settings</h3>
            <p class="text-body-medium text-on-surface-variant">
              Configure your preferences here.
            </p>
          </div>
        </lib-tab-panel>
        <lib-tab-panel>
          <div class="p-4">
            <h3 class="text-title-medium">Notifications</h3>
            <p class="text-body-medium text-on-surface-variant">
              Manage your notification settings.
            </p>
          </div>
        </lib-tab-panel>
      </lib-tab-panels>
    </lib-tab-group>
  `,
})
export class TabsPanelsAngular {}
