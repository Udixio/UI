<script lang="ts">
  import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
  import { iLogout } from '@udixio/icons-rounded-400/logout';
  import { iNotifications } from '@udixio/icons-rounded-400/notifications';
  import { iSchedule } from '@udixio/icons-rounded-400/schedule';
  import { IconButton, NavigationRail, NavigationRailItem } from '@udixio/ui-svelte';
</script>

<NavigationRail class="bg-surface-container-highest h-[500px]">
  {#snippet footer()}
    <IconButton icon={iLogout} label="Sign out" />
  {/snippet}
  <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} selected>Alarm</NavigationRailItem>
  <NavigationRailItem icon={iSchedule} iconSelected={iSchedule}>Clock</NavigationRailItem>
  <NavigationRailItem icon={iHourglass} iconSelected={iHourglass}>Timer</NavigationRailItem>
</NavigationRail>
