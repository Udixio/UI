<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  const photos = [1, 2, 3];
  let open: number | null = $state(null);
</script>

<div class="flex w-full flex-col gap-4">
  <div class="grid grid-cols-3 gap-3">
    {#each photos as id (id)}
      {#if open !== id}
        <!-- The tile is the shared element itself: a native button, neutral, with theme tokens. -->
        <button
          type="button"
          {@attach motion('reflow', () => ({
            shared: `photo-${id}`,
          }))}
          onclick={() => (open = id)}
          class="rounded-2xl bg-primary-container p-6 text-label-large text-on-primary-container"
        >
          Photo {id}
        </button>
      {/if}
    {/each}
  </div>
  {#if open !== null}
    <div
      {@attach motion('reflow', () => ({
        shared: `photo-${open}`,
      }))}
      class="flex flex-col items-start gap-3 rounded-3xl bg-primary p-6 text-on-primary"
    >
      <p class="text-headline-small">Photo {open}</p>
      <Button size="small" variant="tonal" label="Close" onclick={() => (open = null)} />
    </div>
  {/if}
</div>
