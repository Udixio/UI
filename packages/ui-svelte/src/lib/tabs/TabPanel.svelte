<script lang="ts">
import { animateTabPanelEnter } from '@udixio/core/dom';
import { mergeClassNames, tabPanelStyle, type TabPanelInterface } from '@udixio/core';
import { untrack } from 'svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getTabGroupContext } from './tab-group-context.svelte';
  import { getTabPanelsContext, type TabPanelRegistration } from './tab-panels-context.svelte';
  import type { SvelteTabPanelProps } from './tab-panel.types';

  let { children, class: hostClass = '', classes, ...rest }: SvelteTabPanelProps = $props();
  const group = getTabGroupContext();
  const panels = getTabPanelsContext();
  const registration = $state<TabPanelRegistration>({});
  const index = $derived(panels?.indexOf(registration));
  const active = $derived(index != null && group?.selectedIndex() === index);
  const tabsId = $derived(group?.tabsId());
  const domId = $derived(tabsId !== undefined && index !== undefined ? `tabpanel-${tabsId}-${index}` : undefined);
  const labelledBy = $derived(tabsId !== undefined && index !== undefined ? `tab-${tabsId}-${index}` : undefined);
  const styles = createStyle(tabPanelStyle, () => ({ index, tabsId, className: mergeClassNames<TabPanelInterface>('tabPanel', classes, hostClass) }));
  let panel: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!panels) return;
    const unregister = untrack(() => panels.registerPanel(registration));
    return unregister;
  });
  $effect(() => {
    registration.element = panel;
  });

  $effect(() => {
    if (!active || !panel) return;
    const animation = animateTabPanelEnter({ panel, direction: group?.direction() ?? 0 });
    return () => animation?.stop();
  });
</script>

{#if active}
  <div {...rest} bind:this={panel} id={domId} role="tabpanel" aria-labelledby={labelledBy} tabindex="0" class={styles.current['tabPanel']}>
    {@render children?.()}
  </div>
{/if}
