<script lang="ts">
  import { animateStyle } from '@udixio/motion/animate';
  import { Button } from '@udixio/ui-svelte';

  const TRACKS = ['Night Drive', 'Signal Fire', 'Open Road'];
  // The colours, the corners and the clip of the player are not motion fields: animateStyle animates them.
  const STATES = [
    {
      backgroundColor: 'var(--color-primary-container)',
      color: 'var(--color-on-primary-container)',
      borderRadius: '24px',
      clipPath: 'inset(0% round 24px)',
    },
    {
      backgroundColor: 'var(--color-tertiary-container)',
      color: 'var(--color-on-tertiary-container)',
      borderRadius: '8px',
      clipPath: 'inset(6% 4% round 8px)',
    },
    {
      backgroundColor: 'var(--color-secondary-container)',
      color: 'var(--color-on-secondary-container)',
      borderRadius: '20px',
      clipPath: 'inset(3% 0% round 20px)',
    },
  ];

  let player: HTMLElement;
  let index = $state(0);

  // A single keyframe starts from the current style of the player, so the change goes on from where it is.
  function next() {
    const to = (index + 1) % TRACKS.length;
    index = to;
    animateStyle(player, STATES[to]!, { timing: 'spring.default.effects' });
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start gap-4">
  <div
    bind:this={player}
    class="flex h-24 w-full items-center rounded-3xl bg-primary-container px-5 text-title-medium text-on-primary-container"
  >
    {TRACKS[index]}
  </div>
  <Button size="small" label="Next track" onclick={next} />
</div>
