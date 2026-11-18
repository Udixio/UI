<script lang="ts">
  import { scrollTo } from '@udixio/motion/scroll';

  let box: HTMLElement;
  let two: HTMLElement;

  // The scroll follows a spring, and gives the focus to the heading when it arrives.
  function toTwo() {
    scrollTo(two, {
      container: box,
      focus: true,
    });
  }
</script>

<div bind:this={box} tabindex="0" class="h-56 overflow-y-auto">
  <section>Section one</section>
  <section bind:this={two} tabindex="-1">Section two</section>
</div>
<button type="button" onclick={toTwo}>To section two</button>
