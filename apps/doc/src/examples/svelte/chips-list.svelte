<script lang="ts">
  import { Chips } from '@udixio/ui-svelte';

  let items = $state([
    { id: 'photos', label: 'Photos', selected: true },
    { id: 'videos', label: 'Videos', removable: true },
  ]);
</script>

<Chips label="Media filters" bind:items />
