<script lang="ts">
  import { defineMotion, getMotion } from '@udixio/motion';
  import { motion } from '@udixio/ui-svelte';

  // A reveal split into words: the words wait until the sentence enters the view, then play once.
  defineMotion('headline', {
    verb: 'reveal',
    split: 'words',
    reduced: 'fade',
    keyframes: [
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0 },
    ],
  });

  let headline: HTMLElement | undefined = $state();

  function replay() {
    if (headline) getMotion(headline, 'view')?.play();
  }
</script>

<div class="flex flex-col items-start gap-4">
  <p
    bind:this={headline}
    {@attach motion('headline')}
    class="text-headline-medium text-on-surface"
  >
    Every word arrives in turn, and is read once.
  </p>
  <button
    type="button"
    onclick={replay}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    Replay
  </button>
</div>
