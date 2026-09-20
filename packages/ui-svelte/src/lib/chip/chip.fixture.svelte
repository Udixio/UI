<script lang="ts">
  import Chip from './Chip.svelte';
  import type { SvelteChipProps } from './chip.types';

  let {
    mode = 'bind',
    initialSelected = false,
    accept = () => true,
    ...chip
  }: Omit<SvelteChipProps, 'selected'> & {
    mode?: 'bind' | 'function-binding';
    initialSelected?: boolean;
    accept?: (next: boolean) => boolean;
  } = $props();

  let selected = $state(false);
  let initialized = false;
  $effect.pre(() => {
    if (initialized) return;
    selected = initialSelected;
    initialized = true;
  });
  export const readSelected = () => selected;
</script>

{#if mode === 'bind'}
  <Chip {...chip} bind:selected />
{:else}
  <Chip
    {...chip}
    bind:selected={() => selected, (next) => {
      if (accept(next)) selected = next;
    }}
  />
{/if}
