<script lang="ts">
  import { scrollTo } from '@udixio/motion/scroll';
  import { Button } from '@udixio/ui-svelte';

  let box: HTMLElement;
  let two: HTMLElement;

  // The scroll follows a spring, and gives the focus to the section when it arrives.
  function toTwo() {
    scrollTo(two, {
      container: box,
      focus: true,
    });
  }
</script>

<div class="flex w-full max-w-72 flex-col items-start gap-4">
  <div
    bind:this={box}
    tabindex="0"
    class="h-56 w-full overflow-y-auto rounded-3xl bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
  >
    <section class="flex h-56 items-center p-5 text-title-medium text-on-surface">Section one</section>
    <section bind:this={two} tabindex="-1" class="flex h-56 items-center p-5 text-title-medium text-on-surface">Section two</section>
  </div>
  <Button size="small" label="To section two" onclick={toTwo} />
</div>
