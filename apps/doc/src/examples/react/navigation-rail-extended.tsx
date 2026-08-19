import { useState } from 'react';
import {
  Fab,
  NavigationRail,
  NavigationRailItem,
  NavigationRailSection,
} from '@udixio/ui-react';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iTimer } from '@udixio/icons-rounded-400/timer';
import { iCalendarMonth } from '@udixio/icons-rounded-400/calendar_month';
import { iShowChart } from '@udixio/icons-rounded-400/show_chart';
import { iMusicNote } from '@udixio/icons-rounded-400/music_note';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function NavigationRailExtendedReact() {
  const [extended, setExtended] = useState(true);

  return (
    <NavigationRail
      className="bg-surface-container-highest h-[750px]"
      extended={extended}
      onExtendedChange={setExtended}
    >
      <Fab label="Add Timer" icon={iAdd} extended={extended} />
      <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} label="Alarm" />
      <NavigationRailItem icon={iSchedule} iconSelected={iSchedule} label="Clock" />
      <NavigationRailItem icon={iHourglass} iconSelected={iHourglass} label="Timer" />
      <NavigationRailItem icon={iTimer} iconSelected={iTimer} label="Stopwatch" />
      <NavigationRailSection label="Sleep well" />
      <NavigationRailItem label="Schedule" icon={iCalendarMonth} iconSelected={iCalendarMonth} />
      <NavigationRailItem label="Stats" icon={iShowChart} iconSelected={iShowChart} />
      <NavigationRailItem label="Sleep sound" icon={iMusicNote} iconSelected={iMusicNote} />
    </NavigationRail>
  );
}
