<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  let wide = $state(false);
</script>

<!-- Each new state plays the first listed motion that
     is not a presence: the press, and the layout, once
     Svelte has written the new width. -->
<div class="flex w-full flex-col items-start gap-4">
  <span class="inline-flex" {@attach motion('press', () => ({ state: wide }))}>
    <Button size="small" label={wide ? 'Narrow' : 'Widen'} onclick={() => (wide = !wide)} />
  </span>
  <div
    style:width={wide ? '100%' : '50%'}
    class="rounded-2xl bg-surface-container-high p-4"
    {@attach motion('reflow', () => ({ state: wide }))}
  >
    Now playing
  </div>
</div>
