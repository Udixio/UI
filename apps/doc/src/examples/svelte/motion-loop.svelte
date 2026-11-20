<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  let paused = $state(false);
</script>

<div class="flex items-center gap-6">
  <span
    {@attach motion('rotate', () => ({
      paused,
    }))}
    class="block size-8 rounded-full border-4 border-primary border-t-transparent"
  ></span>
  <Button size="small" label={paused ? 'Play spinner' : 'Pause spinner'} onclick={() => (paused = !paused)} />
</div>
