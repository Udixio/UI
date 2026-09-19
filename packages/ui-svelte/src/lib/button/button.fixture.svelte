<script lang="ts">
  import Button from './Button.svelte';
  import type { SvelteButtonProps } from './button.types';

  /**
   * Exercises the binding surfaces a spec cannot express through `render()`
   * props: `bind:pressed`, a rejecting function binding, and a children snippet.
   */
  let {
    mode = 'bind',
    initialPressed = false,
    accept = () => true,
    withChildren = false,
    childrenAriaHidden = false,
    onPressedChange,
    ...button
  }: Omit<SvelteButtonProps, 'pressed' | 'children'> & {
    mode?: 'bind' | 'function-binding';
    initialPressed?: boolean;
    accept?: (next: boolean) => boolean;
    withChildren?: boolean;
    childrenAriaHidden?: boolean;
  } = $props();

  let pressed = $state(initialPressed);
  export const readPressed = () => pressed;
</script>

{#snippet custom()}
  <span aria-hidden={childrenAriaHidden || undefined}>Supprimer</span>
{/snippet}

{#if mode === 'bind'}
  <Button
    {...button}
    toggleable
    bind:pressed
    {onPressedChange}
    children={withChildren ? custom : undefined}
  />
{:else}
  <Button
    {...button}
    toggleable
    bind:pressed={() => pressed, (next) => {
      if (accept(next)) pressed = next;
    }}
    {onPressedChange}
    children={withChildren ? custom : undefined}
  />
{/if}
