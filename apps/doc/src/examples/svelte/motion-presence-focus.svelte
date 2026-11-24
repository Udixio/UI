<script lang="ts">
  // A panel that leaves with focus inside it: its exit gives focus back to the button that opened it.
  import '@udixio/motion/presets';
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let open = $state(false);
  // The Filters button's own <button>, taken by an attachment: bind:this on a component gives the component.
  let opener: Element | undefined;
</script>

<div class="flex flex-col items-start gap-4">
  <Button
    size="small"
    variant="tonal"
    label="Filters"
    aria-expanded={open}
    onclick={() => (open = true)}
    {@attach (element) => {
      opener = element;
    }}
  />
  {#if open}
    <!-- Focus is on Close: the exit moves it to the Filters button before the panel turns inert. -->
    <div {@attach motion('fade', () => ({ restoreFocus: () => opener }))} transition:presence>
      <Button size="small" variant="text" label="Close" onclick={() => (open = false)} />
    </div>
  {/if}
</div>
