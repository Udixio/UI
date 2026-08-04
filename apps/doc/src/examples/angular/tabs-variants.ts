import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Tab, Tabs } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tabs-variants-angular',
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2 w-full">
      <lib-tabs variant="primary" [defaultSelectedTab]="0">
        <lib-tab label="One" />
        <lib-tab label="Two" />
      </lib-tabs>
      <lib-tabs variant="secondary" [defaultSelectedTab]="0">
        <lib-tab label="One" />
        <lib-tab label="Two" />
      </lib-tabs>
    </div>
  `,
})
export class TabsVariantsAngular {}
