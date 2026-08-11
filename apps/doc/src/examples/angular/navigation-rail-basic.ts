import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavigationRail, NavigationRailItem } from '@udixio/ui-angular';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iTimer } from '@udixio/icons-rounded-400/timer';

@Component({
  selector: 'docs-navigation-rail-basic-angular',
  standalone: true,
  imports: [NavigationRail, NavigationRailItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-navigation-rail [className]="'bg-surface-container-highest h-[500px]'">
      <udx-navigation-rail-item [icon]="iNotifications" [iconSelected]="iNotifications" label="Alarm" selected />
      <udx-navigation-rail-item [icon]="iSchedule" [iconSelected]="iSchedule" label="Clock" />
      <udx-navigation-rail-item [icon]="iHourglass" [iconSelected]="iHourglass" label="Timer" />
      <udx-navigation-rail-item [icon]="iTimer" [iconSelected]="iTimer" label="Stopwatch" />
    </udx-navigation-rail>
  `,
})
export class NavigationRailBasicAngular {
  protected readonly iNotifications = iNotifications;
  protected readonly iSchedule = iSchedule;
  protected readonly iHourglass = iHourglass;
  protected readonly iTimer = iTimer;
}
