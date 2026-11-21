<script lang="ts" module>
  import { defineMotion } from '@udixio/motion';

  // 1. Define, once, in the module: the motion is registered under its name, for the whole page.
  defineMotion('toast-in', {
    verb: 'appear',
    keyframes: [
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0 },
    ],
  });
</script>

<script lang="ts">
  // A toast that enters when it is rendered, and leaves before it is removed.
  import { Button, motion, presence } from '@udixio/ui-svelte';

  let saved = $state(false);
</script>

<div class="flex flex-col items-start gap-4">
  <Button label={saved ? 'Remove from library' : 'Save to library'} onclick={() => (saved = !saved)} />
  <div role="status">
    {#if saved}
      <!-- 2. Attach: motion() binds the motion to the element. -->
      <!-- 3. Trigger: the block adds it, and its entry plays; transition:presence keeps it until its exit has played. -->
      <p {@attach motion('toast-in')} transition:presence>Saved to your library</p>
    {/if}
  </div>
</div>
