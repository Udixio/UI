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
        class="flex items-center gap-2 rounded bg-inverse-surface py-1 ps-4 pe-2 text-body-medium text-inverse-on-surface"
      >
        Saved to your library
        <!-- Undo: the toast leaves at once. -->
        <Button
          variant="text"
          size="small"
          label="Undo"
          class="text-inverse-primary"
          stateColor="inverse-primary"
          onclick={() => (toast = false)}
        />
      </div>
    {/if}
  </div>
</div>
