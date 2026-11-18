<script lang="ts">
  import { defineSequence, getSequence } from '@udixio/motion/sequence';
  import { motionSequence } from '@udixio/ui-svelte';

  // Two steps: the body starts a fixed step after the title, and the root names the sequence.
  defineSequence('intro-steps', {
    verb: 'appear',
    steps: {
      title: {
        keyframes: [
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0 },
        ],
      },
      body: {
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        at: '+=normal',
      },
    },
  });

  let intro: HTMLElement | undefined = $state();

  function replay() {
    if (intro) getSequence(intro)?.play();
  }
</script>

<div class="flex flex-col items-start gap-4">
  <div bind:this={intro} {@attach motionSequence('intro-steps')} class="flex flex-col items-start gap-3">
    <h3 data-motion-step="title" class="text-title-large text-on-surface">Steps, in order</h3>
    <p data-motion-step="body" class="text-body-large text-on-surface-variant">The body starts after the title.</p>
  </div>
  <button
    type="button"
    onclick={replay}
    class="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    Replay
  </button>
</div>
