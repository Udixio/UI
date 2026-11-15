<script lang="ts">
  import type { ValueRef } from '@udixio/motion';
  import { untrack } from 'svelte';
  import { motionValue } from './value.attachment.svelte';

  // `source` is read untracked, as in the motion fixture: a change of `onChange` must not bind the element again.
  let {
    source,
    onChange,
    shown = true,
  }: {
    source: ValueRef | string;
    onChange?: (next: number) => void;
    shown?: boolean;
  } = $props();
</script>

{#if shown}
  <div data-testid="box" {@attach motionValue(untrack(() => source), () => ({ onChange }))}></div>
{/if}
