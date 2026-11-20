<script lang="ts">
  import { scrollTo } from '@udixio/motion/scroll';
  import { Button } from '@udixio/ui-svelte';

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

<div class="flex w-full max-w-80 flex-col items-start gap-4">
  <div bind:this={box} tabindex="0" class="h-56 w-full overflow-y-auto">
    <section>Section one</section>
    <section bind:this={two} tabindex="-1">Section two</section>
  </div>
  <Button size="small" label="To section two" onclick={toTwo} />
</div>
