<script lang="ts">
  import '@udixio/motion/presets';
  import { motion } from '@udixio/ui-svelte';
</script>

<!-- A scrub: the cards move against the scroll. -->
<div class="flex w-full max-w-[22rem] flex-col gap-10">
  <article
    {@attach motion('parallax')}
    class="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
  >
    Now playing: Lowlands
  </article>
  <article
    {@attach motion('parallax')}
    class="rounded-3xl bg-tertiary-container px-5 py-4 text-title-small text-on-tertiary-container"
  >
    Up next: Ember Tide
  </article>
</div>
