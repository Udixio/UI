<script lang="ts">
  // The attachment goes on the component: the Button passes it on to its own <button>, which the press moves.
  import '@udixio/motion/presets';
  import { getMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  let saves = $state(0);
  // bind:this on a component gives the component: an attachment of your own gives its element.
  let share: Element | undefined;
</script>

<div class="flex flex-wrap items-center gap-4">
  <!-- Each new state replays the press. -->
  <Button size="small" label="Save" onclick={() => (saves += 1)} {@attach motion('press', () => ({ state: saves }))} />
  <!-- The attachment has no play(): ask the core for the emphasis of the element. -->
  <Button
    size="small"
    variant="tonal"
    label="Share"
    onclick={() => share && getMotion(share, 'emphasis')?.play()}
    {@attach motion('press')}
    {@attach (element) => {
      share = element;
    }}
  />
</div>
