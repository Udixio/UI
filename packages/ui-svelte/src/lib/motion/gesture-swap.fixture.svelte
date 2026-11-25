<script lang="ts">
  import type { GestureRef } from '@udixio/motion';
  import { untrack } from 'svelte';
  import { motionGesture } from './gesture.attachment.svelte';

  // `boxed`: the gesture sits on a host declared with no box, and the box inside it is what an {#if} swaps. Otherwise the
  // element that the {#if} swaps carries the gesture itself. `source` is read untracked: a change of any prop must not bind
  // the element again, only the {#if} swap does.
  let {
    source,
    boxed = false,
    swapped = false,
    onSwipe,
  }: {
    source: GestureRef | string;
    boxed?: boolean;
    swapped?: boolean;
    onSwipe?: (event: CustomEvent<{ direction: 'start' | 'end' }>) => void;
  } = $props();
</script>

{#if boxed}
  <div data-testid="host" data-motion-box="child" {@attach motionGesture(untrack(() => source))}>
    {#if swapped}
      <section data-testid="box"></section>
    {:else}
      <div data-testid="box"></div>
    {/if}
  </div>
{:else if swapped}
  <section data-testid="box" {@attach motionGesture(untrack(() => source), () => ({ onSwipe }))}></section>
{:else}
  <div data-testid="box" {@attach motionGesture(untrack(() => source), () => ({ onSwipe }))}></div>
{/if}
