<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let count = $state(0);
</script>

<button
  type="button"
  {@attach motion('press', () => ({ state: count }))}
  onclick={() => (count += 1)}
  class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
>
  Pressed {count} times
</button>
