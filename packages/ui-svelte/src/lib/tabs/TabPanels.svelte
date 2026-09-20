<script lang="ts">
import { mergeClassNames, tabPanelsStyle, type TabPanelsInterface } from '@udixio/core';
import { untrack } from 'svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getTabGroupContext } from './tab-group-context.svelte';
  import { setTabPanelsContext, type TabPanelRegistration } from './tab-panels-context.svelte';
  import type { SvelteTabPanelsProps } from './tab-panels.types';

  let { children, class: hostClass = '', classes, ...rest }: SvelteTabPanelsProps = $props();
  const group = getTabGroupContext();
  let panels = $state<TabPanelRegistration[]>([]);
  const styles = createStyle(tabPanelsStyle, () => ({ className: mergeClassNames<TabPanelsInterface>('tabPanels', classes, hostClass) }));
  setTabPanelsContext({
    indexOf: (panel) => {
      const index = panels.indexOf(panel);
      return index === -1 ? undefined : index;
    },
    registerPanel: (panel) => {
      panels = [...untrack(() => panels), panel];
      return () => { panels = untrack(() => panels).filter((item) => item !== panel); };
    },
  });
  let warned = false;
  $effect(() => {
    if (group || warned) return;
    warned = true;
    console.warn('TabPanels must be used within a TabGroup');
  });
</script>

<div {...rest} class={styles.current['tabPanels']}>
  {@render children?.()}
</div>
