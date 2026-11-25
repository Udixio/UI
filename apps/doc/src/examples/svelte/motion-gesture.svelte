<script lang="ts">
  import { defineGesture } from '@udixio/motion/gesture';
  import { Button, motion, motionGesture } from '@udixio/ui-svelte';

  // Reorder: the move is prevented, and the state moves the track, so Svelte renders the new order.
  defineGesture('reorder', {
    type: 'reorder',
    alternative: 'grab',
  });
  // Swipe: the card flies out and is aria-hidden; the state counts it. Delete does the same on the focused card.
  defineGesture('complete', {
    type: 'swipe',
    alternative: 'action',
  });

  const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];

  let tracks = $state([...TRACKS]);
  let round = $state(0);
  let swiped = $state(0);

  function move(from: number, to: number) {
    const next = [...tracks];
    const [track] = next.splice(from, 1);
    next.splice(to, 0, track!);
    tracks = next;
  }

  function onReorder(event: CustomEvent<{ from: number; to: number }>) {
    event.preventDefault();
    move(event.detail.from, event.detail.to);
  }
</script>

<div class="flex w-full max-w-88 flex-col items-start gap-4">
  <ul class="flex w-full flex-col gap-2">
    {#each tracks as track (track)}
      <li
        class="cursor-grab rounded-2xl bg-surface-container-highest py-2.5 pl-4 pr-4 text-body-large text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        {@attach motion('reflow')}
        {@attach motionGesture('reorder', () => ({
          onReorder,
        }))}
      >
        {track}
      </li>
    {/each}
  </ul>
  {#key round}
    <!-- A new round renders the card again: a swiped card stays aria-hidden until the page removes it. -->
    <div
      class="cursor-grab rounded-2xl bg-tertiary-container px-4 py-3 text-title-small text-on-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      {@attach motionGesture('complete', () => ({ onSwipe: () => (swiped += 1) }))}
    >
      Suggested: Lantern
    </div>
  {/key}
  <p class="text-body-medium text-on-surface-variant">Swiped away: {swiped}</p>
  <Button
    size="small"
    label="Restore the queue"
    onclick={() => {
      tracks = [...TRACKS];
      round += 1;
      swiped = 0;
    }}
  />
</div>
