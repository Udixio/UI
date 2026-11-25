<script lang="ts">
  import { flushSync } from 'svelte';
  import { navigate, type NavigationDirection } from '@udixio/motion/page';
  import { Button } from '@udixio/ui-svelte';

  const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];
  let view = $state<'library' | 'player'>('library');

  // The change of view runs inside the transition. flushSync draws the new view before the browser takes its picture.
  function go() {
    const toPlayer = view === 'library';
    const direction: NavigationDirection = toPlayer ? 'forward' : 'back';
    navigate(() => flushSync(() => (view = toPlayer ? 'player' : 'library')), { direction });
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start gap-4">
  {#if view === 'library'}
    <ul class="flex w-full flex-col gap-2">
      {#each TRACKS as track (track)}
        <li class="rounded-2xl bg-surface-container-highest px-4 py-3 text-body-large text-on-surface">{track}</li>
      {/each}
    </ul>
  {:else}
    <div class="flex w-full flex-col gap-2 rounded-3xl bg-tertiary-container p-5 text-on-tertiary-container">
      <span class="text-label-large">Now playing</span>
      <span class="text-title-large">Night Drive</span>
    </div>
  {/if}
  <Button size="small" label={view === 'library' ? 'Open the player' : 'Back to the library'} onclick={go} />
</div>
