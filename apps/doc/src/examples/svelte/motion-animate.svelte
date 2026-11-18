<script lang="ts">
  import { animateStyle, createSpring } from '@udixio/motion/animate';

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

<div bind:this={card}>Next state</div>
<button type="button" onclick={next}>Next state</button>
<input
  type="range"
  min="0"
  max="300"
  value="0"
  aria-label="Position"
  oninput={(event) => offset.to(Number(event.currentTarget.value))}
/>
<span bind:this={dot}></span>
