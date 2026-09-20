<script lang="ts">
  import { Tab, Tabs } from '@udixio/ui-svelte';

  let selectedTab = $state<number | null>(0);
</script>

<Tabs bind:selectedTab scrollable>
  <Tab label="Overview" />
  <Tab label="Activity" />
  <Tab label="Settings" />
  <Tab label="Billing" />
  <Tab label="Advanced" />
</Tabs>
