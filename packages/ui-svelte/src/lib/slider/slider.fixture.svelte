<script lang="ts">
  import Slider from './Slider.svelte';
  import type { SvelteSliderProps } from './slider.types';

  let {
    mode = 'bind',
    initialValue = 0,
    accept = () => true,
    ...sliderProps
  }: Omit<SvelteSliderProps, 'value' | 'defaultValue'> & {
    mode?: 'bind' | 'function-binding';
    initialValue?: number;
    accept?: (next: number) => boolean;
  } = $props();

  let value = $state(0);
  let initialized = false;

  $effect.pre(() => {
    if (initialized) return;
    value = initialValue;
    initialized = true;
  });

  export const readValue = () => value;
</script>

{#if mode === 'bind'}
  <Slider {...sliderProps} bind:value />
{:else}
  <Slider
    {...sliderProps}
    bind:value={() => value, (next) => {
      if (accept(next)) value = next;
    }}
  />
{/if}
