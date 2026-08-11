import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Tab, Tabs } from '@udixio/ui-angular';

@Component({
  selector: 'docs-tabs-variants-angular',
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 w-full">
      <udx-tabs variant="primary" [defaultSelectedTab]="0">
        <udx-tab label="One" />
        <udx-tab label="Two" />
      </udx-tabs>
      <udx-tabs variant="secondary" [defaultSelectedTab]="0">
        <udx-tab label="One" />
        <udx-tab label="Two" />
      </udx-tabs>
    </div>
  `,
})
export class TabsVariantsAngular {}
