<script lang="ts">
  import '@udixio/motion/presets';
  import { Button, motion } from '@udixio/ui-svelte';

  let likes = $state(0);
</script>

<div class="flex flex-col items-start gap-4">
  <!-- The like button presses on each click: each new value of state replays the press. -->
  <Button
    size="small"
    label="Like"
    onclick={() => (likes += 1)}
    {@attach motion('press', () => ({ state: likes }))}
  />
  <p class="text-body-medium text-on-surface-variant">Likes: {likes}</p>
</div>
