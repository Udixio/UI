<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
  import { iNotifications } from '@udixio/icons-rounded-400/notifications';
  import { iSchedule } from '@udixio/icons-rounded-400/schedule';
  import { iTimer } from '@udixio/icons-rounded-400/timer';
  import { Fab, NavigationRail, NavigationRailItem } from '@udixio/ui-svelte';

  let selectedItem = $state<number | null>(0);
</script>

<NavigationRail class="bg-surface-container-highest h-[750px]" bind:selectedItem>
  {#snippet fab()}
    <Fab label="Add Timer" icon={iAdd} />
  {/snippet}
  <NavigationRailItem icon={iNotifications} iconSelected={iNotifications} label="Alarm" />
  <NavigationRailItem icon={iSchedule} iconSelected={iSchedule} label="Clock" />
  <NavigationRailItem icon={iHourglass} iconSelected={iHourglass} label="Timer" />
  <NavigationRailItem icon={iTimer} iconSelected={iTimer} label="Stopwatch" />
</NavigationRail>
