<script lang="ts">
  import '@udixio/motion/presets';
  import { motion, presence } from '@udixio/ui-svelte';

  let open = $state(true);
  let saves = $state(0);
</script>

<div class="flex flex-col items-start gap-4">
  {#if open}
    <div {@attach motion('fade')} transition:presence>Fades in and out</div>
  {/if}
  <button type="button" onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'}</button>
  <button type="button" {@attach motion('press', () => ({ state: saves }))} onclick={() => (saves += 1)}>
    Save
  </button>
</div>
