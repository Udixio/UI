<script lang="ts">
  import { Button, tooltip } from '@udixio/ui-svelte';

  let open = $state(false);
</script>

<div class="flex items-center gap-6 p-8">
  <Button
    label={open ? 'Hide' : 'Show'}
    onclick={() => (open = !open)}
    {@attach tooltip(() => ({
      text: 'Controlled tooltip',
      open,
      onOpenChange: (next) => (open = next),
    }))}
  />
</div>
