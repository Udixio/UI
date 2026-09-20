<script lang="ts">
  import { menuHeadlineStyle, mergeClassNames, type MenuHeadlineInterface } from '@udixio/core';
  import { createStyle } from '../utils/create-style.svelte';
  import { getMenuContext } from './menu-context.svelte';
  import type { SvelteMenuHeadlineProps } from './menu-headline.types';

  let { label, variant, class: hostClass = '', classes, ...rest }: SvelteMenuHeadlineProps = $props();
  const context = getMenuContext();
  const resolvedVariant = $derived(variant ?? context?.variant() ?? 'standard');
  const styles = createStyle(menuHeadlineStyle, () => ({
    label,
    variant: resolvedVariant,
    className: mergeClassNames<MenuHeadlineInterface>('headline', classes, hostClass),
  }));
</script>

<div {...rest} class={styles.current['headline']} role="presentation">{label}</div>
