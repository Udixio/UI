import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Fab, NavigationRail, NavigationRailItem } from '@udixio/ui-angular';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iTimer } from '@udixio/icons-rounded-400/timer';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-navigation-rail-selection-angular',
  standalone: true,
  imports: [NavigationRail, NavigationRailItem, Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-navigation-rail
      [className]="'bg-surface-container-highest h-[750px]'"
      [selectedItem]="index()"
      (selectedItemChange)="index.set($event)"
    >
      <lib-fab label="Add Timer" [icon]="iAdd" />
      <lib-navigation-rail-item [icon]="iNotifications" [iconSelected]="iNotifications" label="Alarm" />
      <lib-navigation-rail-item [icon]="iSchedule" [iconSelected]="iSchedule" label="Clock" />
      <lib-navigation-rail-item [icon]="iHourglass" [iconSelected]="iHourglass" label="Timer" />
      <lib-navigation-rail-item [icon]="iTimer" [iconSelected]="iTimer" label="Stopwatch" />
    </lib-navigation-rail>
  `,
})
export class NavigationRailSelectionAngular {
  protected readonly index = signal(0);
  protected readonly iNotifications = iNotifications;
  protected readonly iSchedule = iSchedule;
  protected readonly iHourglass = iHourglass;
  protected readonly iTimer = iTimer;
  protected readonly iAdd = iAdd;
}
