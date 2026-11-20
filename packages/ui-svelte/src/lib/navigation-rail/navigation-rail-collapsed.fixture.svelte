<script lang="ts">
  import NavigationRail from './NavigationRail.svelte';
  import NavigationRailItem from './NavigationRailItem.svelte';
  import NavigationRailSection from './NavigationRailSection.svelte';
</script>

<NavigationRail extended={false}>
  <NavigationRailItem label="Alarm" />
  <NavigationRailSection label="Sleep well" />
  <NavigationRailItem label="Schedule" />
</NavigationRail>
