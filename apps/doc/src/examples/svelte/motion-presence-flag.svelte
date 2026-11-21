<script lang="ts">
  // A card that stays in the DOM: the present option plays its exit and its entry.
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let open = $state(true);
</script>

<button type="button" onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'}</button>
<!-- No {#if}: once its exit has played, the card stays, transparent and inert. -->
<div {@attach motion('slide', () => ({ present: open }))}>Saved to your library</div>
