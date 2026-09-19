<script lang="ts">
  import Switch from './Switch.svelte';
  import type { SvelteSwitchProps } from './switch.types';

  let {
    mode = 'bind',
    initialChecked = false,
    accept = () => true,
    ...switchProps
  }: Omit<SvelteSwitchProps, 'checked' | 'defaultChecked'> & {
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
  <Switch {...switchProps} bind:checked />
{:else}
  <Switch
    {...switchProps}
    bind:checked={() => checked, (next) => {
      if (accept(next)) checked = next;
    }}
  />
{/if}
