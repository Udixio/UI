<script lang="ts">
  import type { GestureRef } from '@udixio/motion';
  import { untrack } from 'svelte';
  import { motionGesture } from './gesture.attachment.svelte';

  // `source` is read untracked, as in the value fixture: a change of a handler must not bind the element again.
  let {
    source,
    onDragEnd,
    onSwipe,
    onReorder,
    shown = true,
  }: {
    source: GestureRef | string;
    onDragEnd?: (event: CustomEvent<{ x: number; y: number }>) => void;
    onSwipe?: (event: CustomEvent<{ direction: 'start' | 'end' }>) => void;
    onReorder?: (event: CustomEvent<{ from: number; to: number }>) => void;
    shown?: boolean;
  } = $props();
</script>

{#if shown}
  <div
    data-testid="box"
    {@attach motionGesture(untrack(() => source), () => ({ onDragEnd, onSwipe, onReorder }))}
  ></div>
{/if}
