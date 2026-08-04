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
    <lib-tabs [defaultSelectedTab]="0">
      <lib-tab label="Home" [icon]="iHome" />
      <lib-tab label="Settings" [icon]="iSettings" />
      <lib-tab label="Profile" [icon]="iPerson" />
    </lib-tabs>
  `,
})
export class TabsBasicAngular {
  readonly iHome = iHome;
  readonly iSettings = iSettings;
  readonly iPerson = iPerson;
}
