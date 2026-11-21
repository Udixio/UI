<script lang="ts">
  // A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let open = $state(false);
  // The opener is a Udixio Button: its wrapper gives focus the place to return to.
  let opener: HTMLElement | undefined = $state();
</script>

<div class="flex flex-col items-start gap-4">
  <span bind:this={opener} class="inline-flex">
    <Button size="small" variant="tonal" label="Filters" aria-expanded={open} onclick={() => (open = true)} />
  </span>
  {#if open}
    <!-- Focus is on Close: the exit moves it to the Filters button before the panel turns inert. -->
    <div {@attach motion('fade', () => ({ restoreFocus: () => opener?.querySelector('button') }))} transition:presence>
      <Button size="small" variant="text" label="Close" onclick={() => (open = false)} />
    </div>
  {/if}
</div>
