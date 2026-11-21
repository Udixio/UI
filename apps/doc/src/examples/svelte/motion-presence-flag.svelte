<script lang="ts">
  // A card that stays in the DOM: the present option plays its exit and its entry, then hidden hides the card.
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  let open = $state(true);
  const id = $props.id();
</script>

<div class="flex flex-col items-start gap-4">
  <!-- aria-expanded and aria-controls tell assistive technology that the button shows and hides the card. -->
  <Button
    size="small"
    label={open ? 'Hide' : 'Show'}
    aria-expanded={open}
    aria-controls="{id}-card"
    onclick={() => (open = !open)}
  />
  <!-- No {#if}: the card stays in the DOM. The server runs no attachment, so hidden={!open} hides it in the server HTML. -->
  <div id="{id}-card" hidden={!open} {@attach motion('slide', () => ({ present: open }))}>Saved to your library</div>
</div>
