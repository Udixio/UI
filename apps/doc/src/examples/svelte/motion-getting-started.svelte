<script lang="ts">
  import {
    Button,
    motion,
    presence,
  } from '@udixio/ui-svelte';
  import './motion-toast'; // Step 2: the motion.
  let toast = $state(false);
</script>

<div class="flex flex-col items-center gap-6">
  <Button
    size="small"
    label="Save to library"
    onclick={() => (toast = true)}
  />
  <!-- Step 3. A live region announces the toast. -->
  <div role="status" class="h-12">
    {#if toast}
      <div
        {@attach motion('toast')}
        transition:presence
        class="flex min-h-12 items-center gap-2
          rounded bg-inverse-surface py-0.5 ps-4 pe-2
          text-body-medium text-inverse-on-surface"
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
