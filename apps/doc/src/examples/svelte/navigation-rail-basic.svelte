<script lang="ts">
  import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
  import { iNotifications } from '@udixio/icons-rounded-400/notifications';
  import { iSchedule } from '@udixio/icons-rounded-400/schedule';
  import { iTimer } from '@udixio/icons-rounded-400/timer';
  import { NavigationRail, NavigationRailItem } from '@udixio/ui-svelte';
</script>

<NavigationRail class="bg-surface-container-highest h-[500px]">
  <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} selected>Alarm</NavigationRailItem>
  <NavigationRailItem icon={iSchedule} iconSelected={iSchedule}>Clock</NavigationRailItem>
  <NavigationRailItem icon={iHourglass} iconSelected={iHourglass}>Timer</NavigationRailItem>
  <NavigationRailItem icon={iTimer} iconSelected={iTimer}>Stopwatch</NavigationRailItem>
</NavigationRail>
