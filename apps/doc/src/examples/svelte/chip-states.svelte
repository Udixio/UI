<script lang="ts">
  import { Chip } from '@udixio/ui-svelte';

  let selected = $state(false);
</script>

<Chip label="Photos" bind:selected />
