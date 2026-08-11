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
    <udx-navigation-rail [className]="'bg-surface-container-highest h-[500px]'">
      <udx-icon-button footer [icon]="iLogout" label="Sign out" />
      <udx-navigation-rail-item [icon]="iNotifications" [iconSelected]="iNotifications" label="Alarm" selected />
      <udx-navigation-rail-item [icon]="iSchedule" [iconSelected]="iSchedule" label="Clock" />
      <udx-navigation-rail-item [icon]="iHourglass" [iconSelected]="iHourglass" label="Timer" />
    </udx-navigation-rail>
  `,
})
export class NavigationRailFooterAngular {
  protected readonly iNotifications = iNotifications;
  protected readonly iSchedule = iSchedule;
  protected readonly iHourglass = iHourglass;
  protected readonly iLogout = iLogout;
}
