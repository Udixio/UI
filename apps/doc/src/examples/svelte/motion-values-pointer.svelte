<script lang="ts">
  import { defineValue } from '@udixio/motion/value';
  import { Slider, motionValue } from '@udixio/ui-svelte';

  // One value on both axes, in degrees: the card's CSS reads each channel with its unit.
  defineValue('tilt', { source: 'pointer', axis: 'both', range: [-8, 8], unit: 'deg' });
  // A state value: the slider sets it, and the gauge scales with it.
  defineValue('level', { source: 'state', range: [0, 1] });

  let level = $state(0.6);
</script>

<div class="flex w-full max-w-72 flex-col gap-6">
  <!-- The vertical channel is negated, so the card sinks under the pointer on both axes. -->
  <div
    {@attach motionValue('tilt')}
    class="rounded-3xl bg-primary-container p-5 text-on-primary-container [transform:perspective(600px)_rotateY(var(--udx-motion-value-tilt-x-deg,0deg))_rotateX(calc(var(--udx-motion-value-tilt-y-deg,0deg)_*_-1))] motion-reduce:[transform:none]"
  >
    <p class="text-title-large">Move over this card</p>
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
