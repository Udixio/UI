import { IconButton, NavigationRail, NavigationRailItem } from '@udixio/ui-react';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iLogout } from '@udixio/icons-rounded-400/logout';

export default function NavigationRailFooterReact() {
  return (
    <NavigationRail
      className="bg-surface-container-highest h-[500px]"
      footer={<IconButton icon={iLogout} label="Sign out" />}
    >
      <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} selected>
        Alarm
      </NavigationRailItem>
      <NavigationRailItem icon={iSchedule} iconSelected={iSchedule}>
        Clock
      </NavigationRailItem>
      <NavigationRailItem icon={iHourglass} iconSelected={iHourglass}>
        Timer
      </NavigationRailItem>
    </NavigationRail>
  );
}
