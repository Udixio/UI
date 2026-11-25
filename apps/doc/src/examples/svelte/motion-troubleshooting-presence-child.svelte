<script lang="ts">
  import '@udixio/motion/presets';
  import { motion, presence } from '@udixio/ui-svelte';

  let open = $state(true);
</script>

<button type="button" onclick={() => (open = !open)}>Toggle the panel</button>
<!-- Svelte plays the exit of an element that the block of this template removes, when the transition sits on that element. -->
{#if open}
  <p {@attach motion('fade')} transition:presence>Saved to your library</p>
{/if}
