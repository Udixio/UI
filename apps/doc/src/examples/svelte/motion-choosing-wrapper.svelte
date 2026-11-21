<script lang="ts">
  // The attachment goes on a plain element of yours, around the component: you know which box moves.
  import '@udixio/motion/presets';
  import { getMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  let saves = $state(0);
  let share: HTMLElement;
</script>

<div class="flex flex-wrap items-center gap-4">
  <!-- Each new value of state replays the press. -->
  <span class="inline-flex" {@attach motion('press', () => ({ state: saves }))}>
    <Button size="small" label="Save" onclick={() => (saves += 1)} />
  </span>
  <!-- The attachment has no play(): bind the element, and ask the core for its emphasis. -->
  <span bind:this={share} class="inline-flex" {@attach motion('press')}>
    <Button size="small" variant="tonal" label="Share" onclick={() => getMotion(share, 'emphasis')?.play()} />
  </span>
</div>
