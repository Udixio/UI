<script module lang="ts">
  let nextMenuGroupId = 0;
</script>

<script lang="ts">
  import { menuGroupStyle, mergeClassNames, type MenuGroupInterface } from '@udixio/core';
  import { createStyle } from '../utils/create-style.svelte';
  import { getMenuContext } from './menu-context.svelte';
  import type { SvelteMenuGroupProps } from './menu-group.types';

  let { children, variant, label, class: hostClass = '', classes, ...rest }: SvelteMenuGroupProps = $props();
  const context = getMenuContext();
  const resolvedVariant = $derived(variant ?? context?.variant() ?? 'standard');
  const labelId = `menu-group-${nextMenuGroupId++}`;
  const styles = createStyle(menuGroupStyle, () => ({
    variant: resolvedVariant,
    label,
    className: mergeClassNames<MenuGroupInterface>('menuGroup', classes, hostClass),
  }));
  $effect(() => context?.registerGroup());
</script>

<div
  {...rest}
  data-menu-group
  class={styles.current['menuGroup']}
  role={label ? 'group' : 'presentation'}
  aria-labelledby={label ? labelId : undefined}
>
  {#if label}<div id={labelId} class={styles.current['groupLabel']}>{label}</div>{/if}
  {@render children?.()}
</div>
