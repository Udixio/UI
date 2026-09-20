<script module lang="ts">
  let nextTabGroupId = 0;
</script>

<script lang="ts">
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { setTabGroupContext } from './tab-group-context.svelte';
  import type { SvelteTabGroupProps } from './tab-group.types';

  let { children, selectedTab = $bindable(), defaultSelectedTab = 0, onSelectedTabChange }: SvelteTabGroupProps = $props();
  let previousSelected = $derived<number | null>(null);
  const tabsId = `tab-group-${nextTabGroupId++}`;
  const selectedState = createControllableState({
    value: () => selectedTab,
    defaultValue: () => defaultSelectedTab,
    onChange: (next) => onSelectedTabChange?.(next),
    assign: (next) => (selectedTab = next),
    componentName: 'TabGroup',
    stateName: 'selectedTab',
  });
  const direction = $derived.by(() => {
    const current = selectedState.current;
    const previous = previousSelected;
    return previous !== null && current !== null ? (current > previous ? 1 : -1) : 0;
  });
  $effect(() => { previousSelected = selectedState.current; });

  setTabGroupContext({
    selectedIndex: () => selectedState.current,
    direction: () => direction,
    tabsId: () => tabsId,
    select: (index) => selectedState.set(index),
  });
</script>

{@render children?.()}
