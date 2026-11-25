<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  let wide = $state(false);
</script>

<div class="flex w-full max-w-88 flex-col items-start gap-4">
  <!-- The layout does not observe the inline style: a new state plays the move, once the width is set. -->
  <div
    {@attach motion('reflow', () => ({ state: wide }))}
    style:width={wide ? '100%' : '60%'}
    class="rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container"
  >
    Widen me
  </div>
  <Button size="small" label="Widen" onclick={() => (wide = !wide)} />
</div>
