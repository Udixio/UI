import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Tab, Tabs } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tabs-controlled-angular',
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-tabs
      [selectedTab]="tab()"
      [scrollable]="true"
      (selectedTabChange)="tab.set($event)"
    >
      <lib-tab label="Overview" />
      <lib-tab label="Activity" />
      <lib-tab label="Settings" />
      <lib-tab label="Billing" />
      <lib-tab label="Advanced" />
    </lib-tabs>
  `,
})
export class TabsControlledAngular {
  readonly tab = signal(0);
}
