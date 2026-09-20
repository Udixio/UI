<script lang="ts">
  import { Tab, Tabs } from '@udixio/ui-svelte';
</script>

<div class="flex w-full flex-col gap-2">
  <Tabs variant="primary" defaultSelectedTab={0}><Tab label="One" /><Tab label="Two" /></Tabs>
  <Tabs variant="secondary" defaultSelectedTab={0}><Tab label="One" /><Tab label="Two" /></Tabs>
</div>
