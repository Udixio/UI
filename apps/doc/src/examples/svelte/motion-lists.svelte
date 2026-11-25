<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  const TRACKS = ['Night drive', 'Glass city', 'Low tide', 'Harbour', 'Afterglow', 'Halfway', 'Paper moon'];

  let queue = $state([
    { id: 1, title: 'Intro' },
    { id: 2, title: 'Morning' },
    { id: 3, title: 'Harbour' },
    { id: 4, title: 'Afterglow' },
    { id: 5, title: 'Halfway' },
  ]);
  let lastId = 5;

  function addThree() {
    const three = [0, 1, 2].map(() => {
      lastId += 1;
      return { id: lastId, title: TRACKS[lastId % TRACKS.length] };
    });
    // Added in one update at the bottom: the three cascade in, and past five the oldest leave from the top.
    queue = [...queue, ...three].slice(-5);
  }
</script>

<div class="flex w-full max-w-80 flex-col items-start gap-4">
  <Button size="small" label="Add three" onclick={addThree} />
  <p class="text-title-small text-on-surface">Up next</p>
  <ul class="flex w-full flex-col gap-2">
    {#each queue as track (track.id)}
      <!-- presence keeps a leaving track until its exit has played, then Svelte removes it. -->
      <li
        {@attach motion('cascade reflow')}
        transition:presence
        class="rounded-2xl bg-surface-container-high px-4 py-3 text-body-large text-on-surface"
      >
        {track.title}
      </li>
    {/each}
  </ul>
</div>
