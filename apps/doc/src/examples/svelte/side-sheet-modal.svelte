<script lang="ts">
  import { Button, SideSheet } from '@udixio/ui-svelte';

  let open = $state(false);
  let container = $state<HTMLDivElement | null>(null);
</script>

<div bind:this={container} class="relative min-h-80 w-full overflow-hidden rounded-xl [contain:layout]">
  <div class="grid h-full content-between gap-8 p-4">
    <div class="rounded-xl border border-outline p-4" role="status" aria-live="polite">
      <p class="text-title-medium">Side sheet: {open ? 'open' : 'closed'}</p>
    </div>
    <div class="flex justify-end"><Button label="Open details" onclick={() => (open = true)} /></div>
  </div>
  <SideSheet variant="modal" title="Details" bind:open container={container}>
    <p class="p-4 text-body-medium text-on-surface-variant">Modal content. Press Escape, click the backdrop, or use the close button to dismiss it.</p>
  </SideSheet>
</div>
