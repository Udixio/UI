import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  Fab,
  NavigationRail,
  NavigationRailItem,
  NavigationRailSection,
} from '@udixio/ui-angular';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iTimer } from '@udixio/icons-rounded-400/timer';
import { iCalendarMonth } from '@udixio/icons-rounded-400/calendar_month';
import { iShowChart } from '@udixio/icons-rounded-400/show_chart';
import { iMusicNote } from '@udixio/icons-rounded-400/music_note';
import { iAdd } from '@udixio/icons-rounded-400/add';

@Component({
  selector: 'docs-navigation-rail-extended-angular',
  standalone: true,
  imports: [NavigationRail, NavigationRailItem, NavigationRailSection, Fab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <udx-navigation-rail
      [className]="'bg-surface-container-highest h-[750px]'"
      [extended]="extended()"
      (extendedChange)="extended.set($event)"
    >
      <udx-fab label="Add Timer" [icon]="iAdd" [extended]="extended()" />
      <udx-navigation-rail-item [icon]="iNotifications" [iconSelected]="iNotifications" label="Alarm" />
      <udx-navigation-rail-item [icon]="iSchedule" [iconSelected]="iSchedule" label="Clock" />
      <udx-navigation-rail-item [icon]="iHourglass" [iconSelected]="iHourglass" label="Timer" />
      <udx-navigation-rail-item [icon]="iTimer" [iconSelected]="iTimer" label="Stopwatch" />
      <udx-navigation-rail-section label="Sleep well" />
      <udx-navigation-rail-item [icon]="iCalendarMonth" [iconSelected]="iCalendarMonth" label="Schedule" />
      <udx-navigation-rail-item [icon]="iShowChart" [iconSelected]="iShowChart" label="Stats" />
      <udx-navigation-rail-item [icon]="iMusicNote" [iconSelected]="iMusicNote" label="Sleep sound" />
    </udx-navigation-rail>
  `,
})
export class NavigationRailExtendedAngular {
  protected readonly extended = signal(true);
  protected readonly iNotifications = iNotifications;
  protected readonly iSchedule = iSchedule;
  protected readonly iHourglass = iHourglass;
  protected readonly iTimer = iTimer;
  protected readonly iCalendarMonth = iCalendarMonth;
  protected readonly iShowChart = iShowChart;
  protected readonly iMusicNote = iMusicNote;
  protected readonly iAdd = iAdd;
}
