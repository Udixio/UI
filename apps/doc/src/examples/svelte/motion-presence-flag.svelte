<script lang="ts">
  // A card that stays in the DOM: the present option plays its exit and its entry, then hidden hides the card.
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let open = $state(true);
</script>

<button type="button" onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'}</button>
<!-- No {#if}: the card stays in the DOM. The server runs no attachment, so hidden={!open} hides it in the server HTML. -->
<div hidden={!open} {@attach motion('slide', () => ({ present: open }))}>Saved to your library</div>
