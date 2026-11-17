<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';

  let rows = $state(['One', 'Two', 'Three']);

  function rotate() {
    const [first, ...rest] = rows;
    rows = [...rest, first];
  }
</script>

<div class="flex flex-col items-start gap-4">
  <button
    type="button"
    onclick={rotate}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    Move first to end
  </button>
  <ul class="flex w-64 flex-col gap-2">
    {#each rows as label (label)}
      <li {@attach motion('reflow')} class="rounded-xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface">
        {label}
      </li>
    {/each}
  </ul>
</div>
