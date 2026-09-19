<script lang="ts">
  import { Button } from '@udixio/ui-svelte';

  let pressed = $state(false);
</script>

<Button label="Notifications" toggleable bind:pressed variant="tonal" />
