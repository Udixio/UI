<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let wide = $state(false);
  let end = $state(false);
  let rows = $state(['Build', 'Review', 'Release']);

  function shuffle() {
    rows = [...rows].sort(() => Math.random() - 0.5);
  }
</script>

<div data-motion-scope class="flex w-full max-w-88 flex-col gap-3">
  <div
    {@attach motion('reflow')}
    data-wide={wide || undefined}
    class="w-[60%] rounded-3xl bg-primary-container px-5 py-4 text-on-primary-container data-[wide]:w-full"
  >
    Widen me
  </div>
  <div class="flex" class:justify-end={end} class:justify-start={!end}>
    <span
      {@attach motion('reflow')}
      class="rounded-full bg-secondary-container px-4 py-2 text-label-large text-on-secondary-container"
    >
      Start · End
    </span>
  </div>
  <ul class="flex flex-col gap-2">
    {#each rows as label (label)}
      <li {@attach motion('reflow')} class="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface">
        {label}
      </li>
    {/each}
  </ul>
  <div class="flex flex-wrap gap-2">
    <button type="button" onclick={() => (wide = !wide)} class="rounded-full bg-primary px-5 py-2 text-label-large text-on-primary">
      Widen
    </button>
    <button type="button" onclick={() => (end = !end)} class="rounded-full bg-secondary-container px-5 py-2 text-label-large text-on-secondary-container">
      Start · End
    </button>
    <button type="button" onclick={shuffle} class="rounded-full bg-secondary-container px-5 py-2 text-label-large text-on-secondary-container">
      Shuffle
    </button>
  </div>
</div>
