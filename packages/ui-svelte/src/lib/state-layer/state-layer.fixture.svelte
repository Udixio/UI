<script lang="ts">
  import StateLayer from './StateLayer.svelte';
  import type { SvelteStateLayerProps } from './state-layer.types';

  let {
    trigger = 'button',
    disabled = false,
    ariaDisabled = false,
    nested = false,
    ...layer
  }: SvelteStateLayerProps & {
    trigger?: 'button' | 'a';
    disabled?: boolean;
    ariaDisabled?: boolean;
    nested?: boolean;
  } = $props();
</script>

{#if nested}
  <div class="group/button" data-testid="outer">
    <span class="group/button">
      <button><StateLayer {...layer} /></button>
    </span>
  </div>
{:else if trigger === 'a'}
  <a href="/docs" class="group/button" data-testid="trigger" aria-disabled={ariaDisabled || undefined}>
    <StateLayer {...layer} />
  </a>
{:else}
  <button class="group/button" data-testid="trigger" {disabled}>
    <StateLayer {...layer} />
  </button>
{/if}
