<script lang="ts">
  // A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
  import '@udixio/motion/presets';
  import { motion, presence } from '@udixio/ui-svelte';

  let open = $state(false);
  let opener = $state<HTMLButtonElement>();
</script>

<button bind:this={opener} type="button" aria-expanded={open} onclick={() => (open = true)}>
  Filters
</button>
{#if open}
  <!-- Focus is on Close: the exit moves it to the Filters button before the panel turns inert. -->
  <div {@attach motion('fade', () => ({ restoreFocus: () => opener }))} transition:presence>
    <button type="button" onclick={() => (open = false)}>Close</button>
  </div>
{/if}
