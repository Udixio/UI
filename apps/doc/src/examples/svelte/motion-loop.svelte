<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let paused = $state(false);
</script>

<div class="flex items-center gap-6">
  <span
    {@attach motion('rotate', () => ({
      paused,
    }))}
    class="block size-8 rounded-full border-4 border-primary border-t-transparent"
  ></span>
  <button
    type="button"
    onclick={() => (paused = !paused)}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    {paused ? 'Play spinner' : 'Pause spinner'}
  </button>
</div>
