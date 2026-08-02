import {
  NavigationRail,
  NavigationRailItem,
} from '@udixio/ui-react';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iTimer } from '@udixio/icons-rounded-400/timer';

export default function NavigationRailAlignmentReact() {
  return (
    <div className="h-[500px] flex gap-8">
      <NavigationRail className="bg-surface-container-highest" alignment="top">
        <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} selected>
          Alarm
        </NavigationRailItem>
        <NavigationRailItem icon={iSchedule} iconSelected={iSchedule}>
          Clock
        </NavigationRailItem>
        <NavigationRailItem icon={iHourglass} iconSelected={iHourglass}>
          Timer
        </NavigationRailItem>
        <NavigationRailItem icon={iTimer} iconSelected={iTimer}>
          Stopwatch
        </NavigationRailItem>
      </NavigationRail>
      <NavigationRail className="bg-surface-container-highest" alignment="middle">
        <NavigationRailItem
          icon={iNotifications}
          iconSelected={iNotifications}
          label="Alarm"
          selected
        />
        <NavigationRailItem icon={iSchedule} iconSelected={iSchedule} label="Clock" />
        <NavigationRailItem icon={iHourglass} iconSelected={iHourglass} label="Timer" />
        <NavigationRailItem icon={iTimer} iconSelected={iTimer} label="Stopwatch" />
      </NavigationRail>
    </div>
  );
}
