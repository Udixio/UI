<script lang="ts">
  import {
    getNextNavigationRailExtended,
    mergeClassNames,
    navigationRailStyle,
    type NavigationRailInterface,
    type NavigationRailMenuState,
  } from '@udixio/core';
  import { iClose } from '@udixio/icons-rounded-400/close';
  import { iMenu } from '@udixio/icons-rounded-400/menu';
  import IconButton from '../icon-button/IconButton.svelte';
import { createControllableState } from '../utils/create-controllable-state.svelte';
import { createStyle } from '../utils/create-style.svelte';
import { untrack } from 'svelte';
  import { setNavigationRailContext, type RailItemRegistration } from './navigation-rail-context.svelte';
  import type { SvelteNavigationRailProps } from './navigation-rail.types';

  // Keep the menu model local to the adapter; it is part of the shared contract but not a core export.
  const DEFAULT_MENU: { closed: NavigationRailMenuState; opened: NavigationRailMenuState } = {
    closed: { icon: iMenu, label: 'Open menu' },
    opened: { icon: iClose, label: 'Close menu' },
  };

  let {
    children,
    footer,
    fab,
    variant = 'standard',
    alignment = 'top',
    menu = DEFAULT_MENU,
    extended = $bindable(),
    defaultExtended = false,
    selectedItem = $bindable(),
    defaultSelectedItem = null,
    onExtendedChange,
    onSelectedItemChange,
    onItemSelected,
    class: hostClass = '',
    style: hostStyle,
    classes,
    ...rest
  }: SvelteNavigationRailProps = $props();

  let registrations = $state<RailItemRegistration[]>([]);
  let hasSection = $state(false);
  let lastEmittedIndex: number | null = null;

  const extendedState = createControllableState({
    value: () => extended,
    defaultValue: () => defaultExtended,
    onChange: (next) => onExtendedChange?.(next),
    assign: (next) => (extended = next),
    componentName: 'NavigationRail',
    stateName: 'extended',
  });
  const selectedState = createControllableState({
    value: () => selectedItem,
    defaultValue: () => defaultSelectedItem,
    onChange: (next) => onSelectedItemChange?.(next),
    assign: (next) => (selectedItem = next),
    componentName: 'NavigationRail',
    stateName: 'selectedItem',
  });
  const selectedIndex = $derived(selectedState.current);

  setNavigationRailContext({
    isExtended: () => extendedState.current,
    selectedIndex: () => selectedState.current,
    indexOf: (registration) => {
      const index = registrations.indexOf(registration);
      return index === -1 ? undefined : index;
    },
    registerItem: (registration) => {
      registration.extendedOnly = untrack(() => hasSection);
      registrations = [...untrack(() => registrations), registration];
      return () => { registrations = untrack(() => registrations).filter((item) => item !== registration); };
    },
    registerSection: () => {
      hasSection = true;
      return () => undefined;
    },
    select: (index) => selectedState.set(index),
    menu: () => menu,
  });

  const styles = createStyle(navigationRailStyle, () => ({
    variant,
    alignment,
    menu,
    selectedItem,
    extended,
    defaultExtended,
    onExtendedChange,
    isExtended: extendedState.current,
    selectedIndex,
    className: mergeClassNames<NavigationRailInterface>('navigationRail', classes, hostClass),
  }));

  const toggleExtended = () => extendedState.set(getNextNavigationRailExtended(extendedState.current));

  $effect(() => {
    const index = selectedState.current;
    if (index == null || index === lastEmittedIndex) return;
    const item = registrations[index];
    if (!item) return;
    lastEmittedIndex = index;
    onItemSelected?.({ index, label: item.label, icon: item.icon });
  });
</script>

<div {...rest} class={styles.current['navigationRail']} style={`${hostStyle ?? ''}${hostStyle && !hostStyle.endsWith(';') ? ';' : ''}transition: 0.3s`}>
  <div class={styles.current['header']}>
    <IconButton
      label={extendedState.current ? menu.opened.label : menu.closed.label}
      icon={extendedState.current ? menu.opened.icon : menu.closed.icon}
      class={styles.current['menuIcon']}
      onclick={toggleExtended}
    />
    {#if fab}<div class="mx-5 [&_.fab]:!shadow-none">{@render fab()}</div>{/if}
  </div>
  <div class={styles.current['segments']}>
    {@render children?.()}
  </div>
  <div class={styles.current['footer']}>{#if footer}{@render footer()}{/if}</div>
</div>
