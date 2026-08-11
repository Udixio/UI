import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Tab, Tabs } from '@udixio/ui-angular';
import { iHome } from '@udixio/icons-rounded-400/home';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iPerson } from '@udixio/icons-rounded-400/person';

@Component({
  selector: 'docs-tabs-basic-angular',
  standalone: true,
  imports: [Tabs, Tab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-tabs [defaultSelectedTab]="0">
      <udx-tab label="Home" [icon]="iHome" />
      <udx-tab label="Settings" [icon]="iSettings" />
      <udx-tab label="Profile" [icon]="iPerson" />
    </udx-tabs>
  `,
})
export class TabsBasicAngular {
  readonly iHome = iHome;
  readonly iSettings = iSettings;
  readonly iPerson = iPerson;
}
