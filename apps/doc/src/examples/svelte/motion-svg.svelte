<script lang="ts">
  import { defineMotion, getMotion } from '@udixio/motion';
  import { morph } from '@udixio/motion/svg';
  import { Button, motion } from '@udixio/ui-svelte';

  // A reveal: the check is drawn once, when it enters the view. play() draws it again from nothing.
  defineMotion('check-draw', {
    verb: 'reveal',
    keyframes: [{ draw: 0 }, { draw: 1 }],
    timing: {
      duration: 'duration.extraLong1',
      easing: 'easing.standard',
    },
  });
  // The dot starts at the start of its offset path, and travels to its end.
  defineMotion('travel', {
    verb: 'reveal',
    keyframes: [{ along: 0 }, { along: 1 }],
    timing: {
      duration: 'duration.extraLong2',
      easing: 'easing.standard',
    },
  });

  const PLAY = 'M8 5 L19 12 L8 19 Z';
  const PAUSE = 'M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z';

  let check: SVGPathElement | undefined = $state();
  let dot: HTMLElement | undefined = $state();
  let icon: SVGPathElement | undefined = $state();
  let pressed = $state(false);
  let morphing: ReturnType<typeof morph> | undefined;

  function drawAgain() {
    if (check) getMotion(check, 'view')?.play();
  }

  function moveAgain() {
    if (dot) getMotion(dot, 'view')?.play();
  }

  // The toggle has already set `pressed` to the new state when this runs.
  function morphTo(next: boolean) {
    if (!icon) return;
    // A new morph continues from the shape the icon has reached.
    morphing?.cancel();
    morphing = morph(icon, next ? PAUSE : PLAY, { timing: 'spring.default.spatial' });
  }
</script>

<div class="flex flex-col items-start gap-6">
  <svg viewBox="0 0 48 48" class="size-20 text-primary" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
    <path
      bind:this={check}
      {@attach motion('check-draw')}
      d="M44 24A20 20 0 1 1 4 24A20 20 0 1 1 44 24Z M16 25L22 31L33 19"
    />
  </svg>
  <Button size="small" label="Draw again" onclick={drawAgain} />
  <span
    bind:this={dot}
    {@attach motion('travel')}
    class="size-4 rounded-full bg-primary"
    style="offset-path: path('M16 56C56 8 112 8 152 56'); offset-distance: 100%"
  ></span>
  <Button size="small" label="Move again" onclick={moveAgain} />
  <svg viewBox="0 0 24 24" class="size-16 text-primary" fill="currentColor" aria-hidden="true">
    <path bind:this={icon} d={PLAY} />
  </svg>
  <Button size="small" toggleable bind:pressed onPressedChange={morphTo} label="Morph" />
</div>
