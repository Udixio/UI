<script lang="ts">
  import { tick } from 'svelte';
  import '@udixio/motion/presets';
  import { getMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  let presses = $state(0);
  let wide = $state(false);
  let card: HTMLElement;

  async function widen() {
    // Each new value of state replays the press.
    presses += 1;
    wide = !wide;
    // An inline style is not observed: once Svelte has written the width, ask the layout binding to move.
    await tick();
    getMotion(card, 'layout')?.play();
  }
</script>

<div class="flex w-full flex-col items-start gap-4">
  <span class="inline-flex" {@attach motion('press', () => ({ state: presses }))}>
    <Button size="small" label={wide ? 'Narrow' : 'Widen'} onclick={widen} />
  </span>
  <div
    bind:this={card}
    style:width={wide ? '100%' : '50%'}
    class="rounded-2xl bg-surface-container-high p-4"
    {@attach motion('reflow')}
  >
    Now playing
  </div>
</div>
