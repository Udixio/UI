<script lang="ts">
  import TextField from './TextField.svelte';
  import type { SvelteTextFieldProps } from './text-field.types';

  let {
    mode = 'bind',
    initialValue = '',
    accept = () => true,
    ...textFieldProps
  }: Omit<SvelteTextFieldProps, 'value' | 'defaultValue'> & {
    mode?: 'bind' | 'function-binding';
    initialValue?: string;
    accept?: (next: string) => boolean;
  } = $props();

  let value = $state('');
  let initialized = false;

  $effect.pre(() => {
    if (initialized) return;
    value = initialValue;
    initialized = true;
  });

  export const readValue = () => value;
</script>

{#if mode === 'bind'}
  <TextField {...textFieldProps} bind:value />
{:else}
  <TextField
    {...textFieldProps}
    bind:value={() => value, (next) => {
      if (accept(next)) value = next;
    }}
  />
{/if}
