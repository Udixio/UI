<script lang="ts">
  import '@udixio/motion/presets';
  import { motion, presence } from '@udixio/ui-svelte';

  let open = $state(true);
  let toggle: HTMLButtonElement;
  // Where focus goes when the exit starts with focus inside the card (WCAG 2.4.3).
  const restore = () => ({ restoreFocus: toggle });
</script>

<div class="flex flex-col items-start gap-4">
  <button bind:this={toggle} type="button" aria-expanded={open} onclick={() => (open = !open)}>
    {open ? 'Hide' : 'Show'}
  </button>
  {#if open}
    <div
      {@attach motion('slide', restore)}
      transition:presence
    >Saved</div>
  {/if}
  <div {@attach motion('slide')} class="[--udx-motion:none]">Shown at once</div>
</div>
