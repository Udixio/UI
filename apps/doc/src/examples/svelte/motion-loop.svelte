<script lang="ts">
  import { defineMotion } from '@udixio/motion';
  import { Button, motion } from '@udixio/ui-svelte';

  // Each beat's cycle, in milliseconds.
  const beats = [
    { name: 'beat-low', duration: 800 },
    { name: 'beat-mid', duration: 1100 },
    { name: 'beat-high', duration: 1400 },
  ];

  // One definition, three beats. A loop restarts
  // from its first keyframe: the last returns to it.
  for (const { name, duration } of beats) {
    defineMotion(name, {
      verb: 'loop',
      keyframes: [
        { scaleY: 0.3 },
        { scaleY: 1 },
        { scaleY: 0.3 },
      ],
      timing: {
        duration,
        easing: 'easing.standard',
      },
      pause: 'control',
    });
  }

  let paused = $state(false);
</script>

<div class="flex flex-col items-start gap-6">
  <!-- A bar per beat; the button holds them. -->
  <div class="flex h-16 items-end gap-2">
    {#each beats as { name } (name)}
      <span
        {@attach motion(name, () => ({ paused }))}
        class="block h-full w-3 origin-bottom
          rounded-full bg-primary"
      ></span>
    {/each}
  </div>
  <Button
    size="small"
    label={paused ? 'Play' : 'Pause'}
    onclick={() => (paused = !paused)}
  />
</div>
