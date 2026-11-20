<script lang="ts">
  import { defineValue } from '@udixio/motion/value';
  import { Slider, motionValue } from '@udixio/ui-svelte';

  // Two pointer values, one per axis, and a state value that the range sets.
  defineValue('tilt-x', {
    source: 'pointer',
    axis: 'x',
    range: [-8, 8],
  });
  defineValue('tilt-y', {
    source: 'pointer',
    axis: 'y',
    range: [6, -6],
  });
  defineValue('level', {
    source: 'state',
    range: [0, 1],
  });

  let level = $state(0.6);
</script>

<div class="flex w-full max-w-72 flex-col gap-6">
  <div
    {@attach motionValue('tilt-y')}
    style="transform: rotateX(calc(var(--udx-motion-value-tilt-y, 0) * 1deg))"
  >
    <div
      {@attach motionValue('tilt-x')}
      class="rounded-3xl bg-primary-container p-5 text-on-primary-container"
      style="transform: rotateY(calc(var(--udx-motion-value-tilt-x, 0) * 1deg))"
    >
      <p class="text-title-large">Move over this card</p>
    </div>
  </div>
  <div class="flex items-center gap-3 text-label-large text-on-surface">
    <span>Level</span>
    <div class="w-40">
      <Slider bind:value={level} min={0} max={1} step={0.01} aria-label="Level" />
    </div>
  </div>
  <div class="h-3 overflow-hidden rounded-full bg-surface-container-highest">
    <data
      {@attach motionValue('level')}
      value={level}
      class="block h-full w-full origin-left rounded-full bg-primary [scale:var(--udx-motion-value-level,0)_1]"
    ></data>
  </div>
</div>
