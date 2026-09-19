<script lang="ts">
  import IconButton from './IconButton.svelte';
  import type { SvelteIconButtonProps } from './icon-button.types';

  /**
   * Exercises the Svelte 5 binding surfaces that `render()` cannot express
   * through a plain props object: normal binding and a rejecting function
   * binding.
   */
  let {
    mode = 'bind',
    accept = () => true,
    ...button
  }: Omit<SvelteIconButtonProps, 'pressed'> & {
    mode?: 'bind' | 'function-binding';
    accept?: (next: boolean) => boolean;
  } = $props();

  let pressed = $state(false);
  export const readPressed = () => pressed;
</script>

{#if mode === 'bind'}
  <IconButton {...button} toggleable bind:pressed />
{:else}
  <IconButton
    {...button}
    toggleable
    bind:pressed={() => pressed, (next) => {
      if (accept(next)) pressed = next;
    }}
  />
{/if}
