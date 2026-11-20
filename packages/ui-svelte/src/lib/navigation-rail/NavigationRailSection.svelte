<script lang="ts">
  import { getNavigationRailContext } from './navigation-rail-context.svelte';
  import type { SvelteNavigationRailSectionProps } from './navigation-rail-section.types';

  let { label, class: hostClass = '', ...rest }: SvelteNavigationRailSectionProps = $props();
  const context = getNavigationRailContext();
  $effect(() => context?.registerSection());
</script>

<div {...rest} hidden={!(context?.isExtended() ?? true)} class={`${hostClass} h-9 flex items-center mx-9 mt-3`}>
  <p class="text-label-large text-on-surface-variant">{label}</p>
</div>
