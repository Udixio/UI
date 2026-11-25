<script lang="ts">
  import { defineSequence, getSequence } from '@udixio/motion/sequence';
  import { Button, motionSequence } from '@udixio/ui-svelte';

  // The kicker plays first; the title starts one normal step after it, and the artist one normal step after the title.
  defineSequence('intro-steps', {
    verb: 'appear',
    steps: {
      kicker: { keyframes: [{ opacity: 0 }, { opacity: 1 }] },
      title: {
        keyframes: [{ opacity: 0, y: 12 }, { opacity: 1, y: 0 }],
        timing: { duration: 'duration.extraLong2', easing: 'easing.standard' },
        at: '+=normal',
      },
      body: { keyframes: [{ opacity: 0 }, { opacity: 1 }], at: '+=normal' },
    },
  });

  let intro: HTMLElement | undefined = $state();

  // getSequence() returns the binding of the card, and its play() replays the steps from the start.
  function replay() {
    if (intro) getSequence(intro)?.play();
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start gap-4">
  <div
    bind:this={intro}
    {@attach motionSequence('intro-steps', () => ({ settled: true }))}
    class="flex w-full flex-col gap-2 rounded-3xl bg-primary-container p-5 text-on-primary-container"
  >
    <p data-motion-step="kicker" class="text-label-large">Now playing</p>
    <h3 data-motion-step="title" class="text-title-large">Night Drive</h3>
    <p data-motion-step="body" class="text-body-medium">Lumen · Side B</p>
  </div>
  <Button size="small" label="Replay" onclick={replay} />
</div>
