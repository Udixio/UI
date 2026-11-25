<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  // Three bars on three beats: each beat is a loop of its own.
  // It goes up and back down: a loop restarts from its
  // first keyframe, so the last one returns to it.
  defineMotion('beat-low', {
    verb: 'loop',
    keyframes: [
      { scaleY: 0.3 },
      { scaleY: 1 },
      { scaleY: 0.3 },
    ],
    timing: { duration: 'duration.medium4', easing: 'easing.standard' },
    pause: 'control',
  });
  defineMotion('beat-mid', {
    verb: 'loop',
    keyframes: [
      { scaleY: 0.3 },
      { scaleY: 1 },
      { scaleY: 0.3 },
    ],
    timing: { duration: 'duration.long3', easing: 'easing.standard' },
    pause: 'control',
  });
  defineMotion('beat-high', {
    verb: 'loop',
    keyframes: [
      { scaleY: 0.3 },
      { scaleY: 1 },
      { scaleY: 0.3 },
    ],
    timing: { duration: 'duration.extraLong1', easing: 'easing.standard' },
    pause: 'control',
  });

  let paused = $state(false);
</script>

<div class="flex flex-col items-start gap-6">
  <!-- The three bars play their beats, and the button holds them. -->
  <div class="flex h-16 items-end gap-2">
    <span
      {@attach motion('beat-low', () => ({ paused }))}
      class="block h-full w-3 origin-bottom rounded-full bg-primary"
    ></span>
    <span
      {@attach motion('beat-mid', () => ({ paused }))}
      class="block h-full w-3 origin-bottom rounded-full bg-primary"
    ></span>
    <span
      {@attach motion('beat-high', () => ({ paused }))}
      class="block h-full w-3 origin-bottom rounded-full bg-primary"
    ></span>
  </div>
  <Button size="small" label={paused ? 'Play' : 'Pause'} onclick={() => (paused = !paused)} />
</div>
