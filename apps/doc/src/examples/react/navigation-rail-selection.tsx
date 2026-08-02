import { useState } from 'react';
import {
  Fab,
  NavigationRail,
  NavigationRailItem,
} from '@udixio/ui-react';
import { iNotifications } from '@udixio/icons-rounded-400/notifications';
import { iSchedule } from '@udixio/icons-rounded-400/schedule';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iTimer } from '@udixio/icons-rounded-400/timer';
import { iAdd } from '@udixio/icons-rounded-400/add';

export default function NavigationRailSelectionReact() {
  const [index, setIndex] = useState(0);

  return (
    <NavigationRail
      className="bg-surface-container-highest h-[750px]"
      selectedItem={index}
      setSelectedItem={setIndex}
    >
      <Fab label="Add Timer" icon={iAdd} />
      <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} label="Alarm" />
      <NavigationRailItem icon={iSchedule} iconSelected={iSchedule} label="Clock" />
      <NavigationRailItem icon={iHourglass} iconSelected={iHourglass} label="Timer" />
      <NavigationRailItem icon={iTimer} iconSelected={iTimer} label="Stopwatch" />
    </NavigationRail>
  );
}
