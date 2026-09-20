<script module lang="ts">
  let nextTabsId = 0;
</script>

<script lang="ts">
  import { getNextTabIndex, mergeClassNames, tabsStyle, type TabsInterface } from '@udixio/core';
import { createTabsIndicatorController, type TabsIndicatorController } from '@udixio/core/dom';
import { untrack } from 'svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getTabGroupContext } from './tab-group-context.svelte';
  import { setTabsContext, type TabRegistration } from './tabs-context.svelte';
  import type { SvelteTabsProps } from './tabs.types';

  let {
    children,
    variant = 'primary',
    scrollable = false,
    selectedTab = $bindable(),
    defaultSelectedTab = 0,
    onSelectedTabChange,
    onTabSelected,
    class: hostClass = '',
    classes,
    onkeydown,
    ...rest
  }: SvelteTabsProps = $props();

  const group = getTabGroupContext();
  let tabs = $state<TabRegistration[]>([]);
  let root: HTMLDivElement | undefined = $state();
  let indicator: HTMLSpanElement | undefined = $state();
  let controller: TabsIndicatorController | undefined;
  const ownTabsId = `tabs-${nextTabsId++}`;

  // A TabGroup is the owner when Tabs did not receive its own selection.
  // Keep that decision stable: createControllableState assigns bindable props
  // before invoking onChange, so re-reading selectedTab in the callback would
  // otherwise make the first click switch ownership from the group to Tabs.
  const usesGroupSelection = group !== undefined && selectedTab === undefined;
  const controlledValue = $derived(usesGroupSelection ? group?.selectedIndex() : selectedTab);
  const selectedState = createControllableState({
    value: () => controlledValue,
    defaultValue: () => defaultSelectedTab,
    onChange: (next) => {
      if (usesGroupSelection) group?.select(next);
      else onSelectedTabChange?.(next);
    },
    assign: (next) => {
      if (!usesGroupSelection) selectedTab = next;
    },
    componentName: 'Tabs',
    stateName: 'selectedTab',
  });
  const selectedIndex = $derived(selectedState.current);
  const tabsId = $derived(group?.tabsId() ?? ownTabsId);
  const focusableIndex = $derived.by(() => {
    const selected = selectedIndex;
    if (selected != null && tabs[selected] && !tabs[selected].disabled) return selected;
    return tabs.findIndex((tab) => !tab.disabled);
  });
  const styles = createStyle(tabsStyle, () => ({
    variant,
    scrollable,
    selectedTab,
    defaultSelectedTab,
    selectedIndex,
    className: mergeClassNames<TabsInterface>('tabs', classes, hostClass),
  }));

  setTabsContext({
    selectedIndex: () => selectedState.current,
    focusableIndex: () => focusableIndex,
    variant: () => variant,
    tabsId: () => tabsId,
    hasPanels: () => group !== undefined,
    indexOf: (tab) => {
      const index = tabs.indexOf(tab);
      return index === -1 ? undefined : index;
    },
    registerTab: (tab) => {
      tabs = [...untrack(() => tabs), tab];
      return () => { tabs = untrack(() => tabs).filter((item) => item !== tab); };
    },
    select: (index) => selectedState.set(index),
  });

  const selectFromKeyboard = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || !tabs.length || focusableIndex < 0) {
      onkeydown?.(event);
      return;
    }
    event.preventDefault();
    const next = getNextTabIndex({ key: event.key as 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End', currentIndex: focusableIndex, disabled: tabs.map((tab) => tab.disabled) });
    selectedState.set(next);
    tabs[next]?.element?.focus();
    onkeydown?.(event);
  };

  $effect(() => {
    if (!root || !indicator) return;
    const created = createTabsIndicatorController({
      root,
      indicator,
      selectedTab: () => {
        const index = untrack(() => selectedState.current);
        const tab = index == null ? undefined : tabs[index];
        return variant === 'primary' ? (tab?.content ?? tab?.element ?? null) : (tab?.element ?? null);
      },
    });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });
  $effect(() => {
    selectedIndex;
    variant;
    tabs;
    controller?.update();
  });
  let lastEmitted: number | null = null;
  $effect(() => {
    const index = selectedIndex;
    if (index == null || index === lastEmitted || !tabs[index]) return;
    lastEmitted = index;
    onTabSelected?.({ index, label: tabs[index].label, icon: tabs[index].icon });
  });
</script>

<div {...rest} bind:this={root} role="tablist" class={styles.current['tabs']} onkeydown={selectFromKeyboard}>
  {@render children?.()}
  <span bind:this={indicator} class={styles.current['indicator']}></span>
</div>
