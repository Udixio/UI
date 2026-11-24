<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let open = $state(true);
  // The toggle's own <button>, taken by an attachment: bind:this on a component gives the component.
  let toggle: Element | undefined;
  // Where focus goes when the exit starts with focus inside the card (WCAG 2.4.3).
  const restore = () => ({ restoreFocus: () => toggle });
</script>

<div class="flex flex-col items-start gap-4">
  <Button
    size="small"
    label={open ? 'Hide' : 'Show'}
    aria-expanded={open}
    onclick={() => (open = !open)}
    {@attach (element) => {
      toggle = element;
    }}
  />
  {#if open}
    <div
      {@attach motion('slide', restore)}
      transition:presence
    >Saved</div>
  {/if}
  <div {@attach motion('slide')} class="motion-none">Shown at once</div>
</div>
