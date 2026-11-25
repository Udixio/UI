<script lang="ts">
  import { tick } from 'svelte';
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  let open = $state(false);
  let cover: HTMLElement | undefined = $state();
  let player: HTMLElement | undefined = $state();

  // The focus goes with the element that is shown: the player when it opens, the cover when it closes.
  async function show(next: boolean) {
    open = next;
    await tick();
    (next ? player : cover)?.focus();
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start">
  <!-- The cover and the player share a key: the player grows out of the cover, and back into it. -->
  {#if open}
    <div
      bind:this={player}
      tabindex="-1"
      {@attach motion('reflow', () => ({ shared: 'cover' }))}
      class="flex w-full flex-col items-start gap-4 rounded-3xl bg-tertiary-container p-5 text-on-tertiary-container"
    >
      <span class="size-40 rounded-2xl bg-tertiary"></span>
      <p class="text-title-large">Night drive</p>
      <p class="text-body-medium">Low tide</p>
      <Button size="small" variant="tonal" label="Close" onclick={() => show(false)} />
    </div>
  {:else}
    <!-- The cover is the shared element itself: a native button, as in the HTML tab. -->
    <button
      bind:this={cover}
      type="button"
      aria-label="Open the player"
      {@attach motion('reflow', () => ({ shared: 'cover' }))}
      onclick={() => show(true)}
      class="size-16 rounded-2xl bg-tertiary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
    ></button>
  {/if}
</div>
