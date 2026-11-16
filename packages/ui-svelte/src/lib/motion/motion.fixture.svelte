<script lang="ts">
  import type { MotionSource } from '@udixio/motion';
  import { untrack } from 'svelte';
  import { motion } from './motion.attachment.svelte';

  // `source` is read untracked: `rerender` replaces every prop at once, and a
  // parent that changes only `present` or `state` must not re-bind the element.
  let {
    source,
    present,
    state,
    settled,
    shared,
    paused,
    shown = true,
    marked = false,
  }: {
    source: MotionSource | readonly MotionSource[];
    present?: boolean;
    state?: unknown;
    settled?: boolean;
    shared?: string;
    paused?: boolean;
    shown?: boolean;
    marked?: boolean;
  } = $props();
</script>

{#if shown}
  <div data-testid="box" data-presence={marked ? 'present' : undefined} {@attach motion(untrack(() => source), () => ({ present, state, settled, shared, paused }))}></div>
{/if}
