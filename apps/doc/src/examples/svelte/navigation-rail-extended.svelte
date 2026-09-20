<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iCalendarMonth } from '@udixio/icons-rounded-400/calendar_month';
  import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
  import { iMusicNote } from '@udixio/icons-rounded-400/music_note';
  import { iNotifications } from '@udixio/icons-rounded-400/notifications';
  import { iSchedule } from '@udixio/icons-rounded-400/schedule';
  import { iShowChart } from '@udixio/icons-rounded-400/show_chart';
  import { iTimer } from '@udixio/icons-rounded-400/timer';
  import { Fab, NavigationRail, NavigationRailItem, NavigationRailSection } from '@udixio/ui-svelte';

  let extended = $state(true);
</script>

<NavigationRail class="bg-surface-container-highest h-[750px]" bind:extended>
  {#snippet fab()}
    <Fab label="Add Timer" icon={iAdd} {extended} />
  {/snippet}
  <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} label="Alarm" />
  <NavigationRailItem icon={iSchedule} iconSelected={iSchedule} label="Clock" />
  <NavigationRailItem icon={iHourglass} iconSelected={iHourglass} label="Timer" />
  <NavigationRailItem icon={iTimer} iconSelected={iTimer} label="Stopwatch" />
  <NavigationRailSection label="Sleep well" />
  <NavigationRailItem label="Schedule" icon={iCalendarMonth} iconSelected={iCalendarMonth} />
  <NavigationRailItem label="Stats" icon={iShowChart} iconSelected={iShowChart} />
  <NavigationRailItem label="Sleep sound" icon={iMusicNote} iconSelected={iMusicNote} />
</NavigationRail>
