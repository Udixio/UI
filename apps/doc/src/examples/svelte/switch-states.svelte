<script lang="ts">
  import { Switch } from '@udixio/ui-svelte';

  let checked = $state(false);
</script>

<div class="flex flex-wrap items-center gap-6">
  <Switch aria-label="Controlled" bind:checked />
  <Switch aria-label="Default checked" defaultChecked />
  <Switch aria-label="Disabled" disabled />
  <Switch aria-label="Disabled and checked" defaultChecked disabled />
</div>
