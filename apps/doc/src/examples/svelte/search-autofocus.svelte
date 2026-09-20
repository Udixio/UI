<script lang="ts">
  import { Search } from '@udixio/ui-svelte';

  let mounted = $state(false);
  let focusCount = $state(0);
  let blurCount = $state(0);
</script>

<div class="flex w-full flex-col items-center gap-3">
  <button type="button" class="rounded-full bg-primary px-4 py-2 text-label-large text-on-primary" disabled={mounted} onclick={() => (mounted = true)}>
    Mount auto-focused search
  </button>
  {#if mounted}
    <Search label="Auto-focused search" autoFocus defaultQuery="Material" onFocus={() => (focusCount += 1)} onBlur={() => (blurCount += 1)} />
  {/if}
  <p class="text-body-small text-on-surface-variant" role="status">Focus events: {focusCount} · Blur events: {blurCount}</p>
</div>
