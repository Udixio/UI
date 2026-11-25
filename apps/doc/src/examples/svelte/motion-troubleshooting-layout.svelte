<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let wide = $state(false);
</script>

<!-- A layout motion does not observe the inline style. The state is the value that changes with it: each new state
  plays the move, once the new width is applied. -->
<div
  {@attach motion('reflow', () => ({ state: wide }))}
  style:width={wide ? '100%' : '50%'}
  class="h-16 rounded-2xl bg-primary"
  onclick={() => (wide = !wide)}
></div>
