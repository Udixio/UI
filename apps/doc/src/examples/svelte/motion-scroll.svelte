<script lang="ts">
  import { scrollTo } from '@udixio/motion/scroll';
  import { Button } from '@udixio/ui-svelte';

  const TRACKS = [
    'Glass Harbour',
    'Low Tide',
    'Paper Moon',
    'Slow Current',
    'Afterglow',
    'Night Drive',
    'Signal Fire',
    'Open Road',
    'Dust and Sea',
    'Lantern',
  ];
  const CURRENT = 5;

  let queue: HTMLElement;
  let rows: HTMLElement[] = [];

  // The queue scrolls to the current track, and the track takes the focus when it arrives.
  function toCurrent() {
    scrollTo(rows[CURRENT]!, { container: queue, focus: true });
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start gap-4">
  <div
    bind:this={queue}
    role="region"
    aria-label="Queue"
    tabindex="0"
    class="h-56 w-full overflow-y-auto rounded-3xl bg-surface-container p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    <ol>
      {#each TRACKS as track, index (track)}
        <li
          bind:this={rows[index]}
          class="flex h-14 items-center justify-between gap-2 whitespace-nowrap rounded-2xl px-4 text-body-large"
          class:bg-primary-container={index === CURRENT}
          class:text-on-primary-container={index === CURRENT}
          class:text-on-surface={index !== CURRENT}
        >
          {track}
          {#if index === CURRENT}
            <span class="text-label-medium whitespace-nowrap">Now playing</span>
          {/if}
        </li>
      {/each}
    </ol>
  </div>
  <Button size="small" label="Go to the current track" onclick={toCurrent} />
</div>
