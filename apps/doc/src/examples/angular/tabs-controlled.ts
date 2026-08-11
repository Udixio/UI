import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Tab, Tabs } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tabs-controlled-angular',
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tabs
      [selectedTab]="tab()"
      [scrollable]="true"
      (selectedTabChange)="tab.set($event)"
    >
      <udx-tab label="Overview" />
      <udx-tab label="Activity" />
      <udx-tab label="Settings" />
      <udx-tab label="Billing" />
      <udx-tab label="Advanced" />
    </udx-tabs>
  `,
})
export class TabsControlledAngular {
  readonly tab = signal(0);
}
