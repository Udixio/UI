<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let open = $state(true);
  let saves = $state(0);
</script>

<div class="flex flex-col items-start gap-4">
  {#if open}
    <div {@attach motion('fade')} transition:presence>Fades in and out</div>
  {/if}
  <Button size="small" label={open ? 'Hide' : 'Show'} onclick={() => (open = !open)} />
  <!-- The press goes on the Button itself, and moves its own <button>. -->
  <Button size="small" variant="tonal" label="Save" onclick={() => (saves += 1)} {@attach motion('press', () => ({ state: saves }))} />
</div>
