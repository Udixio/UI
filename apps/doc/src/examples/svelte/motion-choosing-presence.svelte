<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let saved = $state(false);
  let open = $state(false);
  const id = $props.id();
</script>

<div class="flex flex-col items-start gap-4">
  <div class="flex flex-wrap gap-2">
    <Button size="small" label="Save" onclick={() => (saved = true)} />
    <Button
      size="small"
      variant="tonal"
      label={open ? 'Hide details' : 'Show details'}
      aria-expanded={open}
      aria-controls="{id}-details"
      onclick={() => (open = !open)}
    />
  </div>
  <!-- Transient: {#if} removes the toast once transition:presence has played its exit. -->
  <div aria-live="polite">
    {#if saved}
      <div class="flex items-center gap-2" {@attach motion('slide')} transition:presence>
        Saved to your library
        <Button size="small" variant="text" label="Dismiss" onclick={() => (saved = false)} />
      </div>
    {/if}
  </div>
  <!-- Content: no {#if}. The server runs no attachment, so hidden={!open} hides the panel in the server HTML. -->
  <div id="{id}-details" hidden={!open} {@attach motion('fade', () => ({ present: open }))}>
    Recorded live in 1977, remastered in 2019.
  </div>
</div>
