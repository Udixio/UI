import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  IconButton,
  NavigationRail,
  NavigationRailItem,
} from '@udixio/ui-angular';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iLogout } from '@udixio/icons-rounded-400/logout';

@Component({
  selector: 'docs-navigation-rail-footer-angular',
  standalone: true,
  imports: [NavigationRail, NavigationRailItem, IconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-navigation-rail [className]="'bg-surface-container-highest h-[500px]'">
      <lib-icon-button footer [icon]="iLogout" label="Sign out" />
      <lib-navigation-rail-item [icon]="iNotifications" [iconSelected]="iNotifications" label="Alarm" selected />
      <lib-navigation-rail-item [icon]="iSchedule" [iconSelected]="iSchedule" label="Clock" />
      <lib-navigation-rail-item [icon]="iHourglass" [iconSelected]="iHourglass" label="Timer" />
    </lib-navigation-rail>
  `,
})
export class NavigationRailFooterAngular {
  protected readonly iNotifications = iNotifications;
  protected readonly iSchedule = iSchedule;
  protected readonly iHourglass = iHourglass;
  protected readonly iLogout = iLogout;
}
