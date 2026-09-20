<script lang="ts">
import { menuStyle, mergeClassNames, type MenuInterface } from '@udixio/core';
import { createMenuController, type MenuController } from '@udixio/core/dom';
import { untrack } from 'svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { setMenuContext } from './menu-context.svelte';
  import type { SvelteMenuProps } from './menu.types';

  let {
    children,
    variant = 'standard',
    purpose = 'actions',
    accessibleLabel,
    initialFocus = 'none',
    class: hostClass = '',
    classes,
    ...rest
  }: SvelteMenuProps = $props();

  let menu: HTMLDivElement | undefined = $state();
  let groupCount = $state(0);
  let controller: MenuController | undefined;

  setMenuContext({
    purpose: () => purpose,
    variant: () => variant,
    registerGroup: () => {
      groupCount = untrack(() => groupCount) + 1;
      return () => { groupCount = Math.max(0, untrack(() => groupCount) - 1); };
    },
  });

  const styles = createStyle(menuStyle, () => ({
    variant,
    purpose,
    accessibleLabel,
    initialFocus,
    hasGroups: groupCount > 0,
    className: mergeClassNames<MenuInterface>('menu', classes, hostClass),
  }));

  $effect(() => {
    if (!menu) return;
    const created = createMenuController(menu, { initialFocus });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });
</script>

<div
  {...rest}
  bind:this={menu}
  class={styles.current['menu']}
  role={purpose === 'selection' ? 'listbox' : 'menu'}
  aria-label={accessibleLabel}
>
  {@render children?.()}
</div>
