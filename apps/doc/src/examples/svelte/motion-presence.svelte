<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let toast = $state(false);

  // The toast leaves by itself after four seconds.
  $effect(() => {
    if (!toast) return;
    const timer = setTimeout(() => (toast = false), 4000);
    return () => clearTimeout(timer);
  });
</script>

<div class="flex flex-col items-center gap-6">
  <Button
    size="small"
    label="Save to library"
    onclick={() => (toast = true)}
  />
  <!-- A live region: the toast is announced. -->
  <div role="status" class="h-12">
    <!-- presence keeps it until its exit has played. -->
    {#if toast}
      <div
        {@attach motion('slide')}
        transition:presence
        class="rounded bg-inverse-surface px-4 py-3.5 text-body-medium text-inverse-on-surface"
      >
        Saved to your library
      </div>
    {/if}
  </div>
</div>
