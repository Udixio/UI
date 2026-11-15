<script lang="ts">
  import type { SequenceRef } from '@udixio/motion';
  import { motionSequence } from './sequence.attachment.svelte';

  // `source` is read tracked: a new source on a bound element is a new sequence, as the motion attachment treats it.
  let {
    source,
    settled,
    shown = true,
  }: {
    source: SequenceRef | string;
    settled?: boolean;
    shown?: boolean;
  } = $props();
</script>

{#if shown}
  <div data-testid="box" {@attach motionSequence(source, () => ({ settled }))}></div>
{/if}
