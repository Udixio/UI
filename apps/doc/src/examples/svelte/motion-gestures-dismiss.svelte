<script lang="ts">
  import { defineGesture } from '@udixio/motion/gesture';
  import { motion, motionGesture } from '@udixio/ui-svelte';
  import '@udixio/motion/presets';

  // A swipe flies the track out, hidden from assistive
  // technology. Keep afterFlyOut at its default, hide:
  // Svelte removes the track. A focused track hands the
  // focus to the next track as it flies out, by itself.
  defineGesture('dismiss', { type: 'swipe' });

  let tracks = $state(['Night Drive', 'Signal Fire', 'Open Road']);
</script>

<ul class="flex w-full max-w-88 flex-col gap-2">
  {#each tracks as track (track)}
    <!-- reflow closes the gap that a removed track leaves; the swipe removes the track, and onSwipe removes it. -->
    <li
      class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      {@attach motion('reflow')}
      {@attach motionGesture('dismiss', () => ({
        onSwipe: () => {
          tracks = tracks.filter((item) => item !== track);
        },
      }))}
    >
      {track}
    </li>
  {/each}
</ul>
