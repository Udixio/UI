<script lang="ts">
  import '@udixio/motion/presets';
  import { motion, presence } from '@udixio/ui-svelte';

  // The card is in the DOM while `open` is true; `presence` keeps it until its exit has played.
  let open = $state(true);
</script>

<div class="flex flex-col items-start gap-4">
  <button
    type="button"
    onclick={() => (open = !open)}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    Toggle Svelte card
  </button>
  {#if open}
    <div
      {@attach motion('slide')}
      transition:presence
      data-demo-card="svelte"
      class="rounded-2xl bg-surface-container-high p-6"
    >
      <h3 class="text-title-medium text-on-surface">Svelte</h3>
      <p class="text-body-medium text-on-surface-variant">Mounted and unmounted by Svelte.</p>
    </div>
  {/if}
</div>
