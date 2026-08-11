import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tabs-panels-angular',
  standalone: true,
  imports: [Tabs, Tab, TabGroup, TabPanels, TabPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tab-group [defaultSelectedTab]="0">
      <udx-tabs>
        <udx-tab label="Profile" />
        <udx-tab label="Settings" />
        <udx-tab label="Notifications" />
      </udx-tabs>
      <udx-tab-panels>
        <udx-tab-panel>
          <div class="p-4">
            <h3 class="text-title-medium">Profile</h3>
            <p class="text-body-medium text-on-surface-variant">
              This is the profile panel content.
            </p>
          </div>
        </udx-tab-panel>
        <udx-tab-panel>
          <div class="p-4">
            <h3 class="text-title-medium">Settings</h3>
            <p class="text-body-medium text-on-surface-variant">
              Configure your preferences here.
            </p>
          </div>
        </udx-tab-panel>
        <udx-tab-panel>
          <div class="p-4">
            <h3 class="text-title-medium">Notifications</h3>
            <p class="text-body-medium text-on-surface-variant">
              Manage your notification settings.
            </p>
          </div>
        </udx-tab-panel>
      </udx-tab-panels>
    </udx-tab-group>
  `,
})
export class TabsPanelsAngular {}
