<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let open = $state(true);
  // The toggle is a Udixio Button: its wrapper gives focus the place to return to.
  let toggle: HTMLElement | undefined = $state();
  // Where focus goes when the exit starts with focus inside the card (WCAG 2.4.3).
  const restore = () => ({ restoreFocus: () => toggle?.querySelector('button') });
</script>

<div class="flex flex-col items-start gap-4">
  <span bind:this={toggle} class="inline-flex">
    <Button size="small" label={open ? 'Hide' : 'Show'} aria-expanded={open} onclick={() => (open = !open)} />
  </span>
  {#if open}
    <div
      {@attach motion('slide', restore)}
      transition:presence
    >Saved</div>
  {/if}
  <div {@attach motion('slide')} class="motion-none">Shown at once</div>
</div>
