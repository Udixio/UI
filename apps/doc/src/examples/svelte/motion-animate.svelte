<script lang="ts">
  import { animateStyle, createSpring } from '@udixio/motion/animate';
  import { Button, Slider } from '@udixio/ui-svelte';

  const STATES = [
    { backgroundColor: 'var(--color-primary-container)', borderRadius: '28px', clipPath: 'inset(0% round 28px)' },
    { backgroundColor: 'var(--color-tertiary-container)', borderRadius: '8px', clipPath: 'inset(6% 4% round 8px)' },
  ];

  let card: HTMLElement;
  let dot: HTMLElement;
  let state = 0;

  // The dot follows the range over a spring: its number is written to the element.
  const offset = createSpring(0, {
    timing: 'spring.default.spatial',
    onUpdate: (value) => {
      if (dot) dot.style.translate = `${value}px 0`;
    },
  });
  $effect(() => () => offset.stop());

  // A single keyframe starts from the current style of the card.
  function next() {
    state = (state + 1) % STATES.length;
    animateStyle(card, STATES[state]!, {
      timing: 'spring.default.effects',
    });
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start gap-4">
  <div
    bind:this={card}
    class="flex h-24 w-full items-center justify-center rounded-3xl bg-surface-container-high text-title-medium text-on-surface"
  >
    Next state
  </div>
  <Button size="small" label="Next state" onclick={next} />
  <Slider
    min={0}
    max={300}
    step={1}
    defaultValue={0}
    aria-label="Position"
    onChange={(value) => offset.to(value)}
  />
  <span bind:this={dot} class="block size-4 rounded-full bg-primary"></span>
</div>
