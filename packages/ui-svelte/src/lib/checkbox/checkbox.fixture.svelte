<script lang="ts">
  import Checkbox from './Checkbox.svelte';
  import type { SvelteCheckboxProps } from './checkbox.types';

  let {
    mode = 'bind',
    initialChecked = false,
    accept = () => true,
    ...checkbox
  }: Omit<SvelteCheckboxProps, 'checked' | 'defaultChecked'> & {
    mode?: 'bind' | 'function-binding';
    initialChecked?: boolean;
    accept?: (next: boolean) => boolean;
  } = $props();

  let checked = $state(false);
  let initialized = false;
  $effect.pre(() => {
    if (initialized) return;
    checked = initialChecked;
    initialized = true;
  });
  export const readChecked = () => checked;
</script>

{#if mode === 'bind'}
  <Checkbox {...checkbox} bind:checked />
{:else}
  <Checkbox
    {...checkbox}
    bind:checked={() => checked, (next) => {
      if (accept(next)) checked = next;
    }}
  />
{/if}
