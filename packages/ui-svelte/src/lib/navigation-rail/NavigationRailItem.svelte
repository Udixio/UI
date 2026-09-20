<script lang="ts">
  import {
    navigationRailItemStyle,
    resolveNavigationRailItemSelection,
    mergeClassNames,
    type NavigationRailItemInterface,
  } from '@udixio/core';
  import { createNavigationRailItemLabelController, type NavigationRailItemLabelController } from '@udixio/core/dom';
  import Badge from '../badge/Badge.svelte';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getNavigationRailContext, type RailItemRegistration } from './navigation-rail-context.svelte';
  import type { SvelteNavigationRailItemProps } from './navigation-rail-item.types';

  let {
    label,
    children,
    icon,
    iconSelected,
    badge,
    selected = false,
    href,
    class: hostClass = '',
    style: hostStyle,
    classes,
    onclick,
    onItemSelected,
    ...rest
  }: SvelteNavigationRailItemProps = $props();

  const context = getNavigationRailContext();
  const registration = $state<RailItemRegistration>({ label: undefined, icon: undefined, extendedOnly: false });
  const resolvedIndex = $derived(context?.indexOf(registration));
  const resolvedVariant = $derived<'vertical' | 'horizontal'>(context?.isExtended() ? 'horizontal' : 'vertical');
  const selectedIndex = $derived(context?.selectedIndex() ?? null);
  const isSelected = $derived(resolveNavigationRailItemSelection({ selectedItem: selectedIndex, index: resolvedIndex, selected }));
  const hidden = $derived(!!registration.extendedOnly && !(context?.isExtended() ?? true));
  const initialHorizontalStyle = $derived(resolvedVariant === 'horizontal' ? 'overflow: hidden' : 'width: 0px; opacity: 0; overflow: hidden');
  const initialVerticalStyle = $derived(resolvedVariant === 'vertical' ? 'overflow: hidden' : 'height: 0px; opacity: 0; overflow: hidden');
  const styles = createStyle(navigationRailItemStyle, () => ({
    label,
    icon,
    iconSelected,
    badge,
    selected,
    variant: resolvedVariant,
    index: resolvedIndex,
    selectedItem: selectedIndex,
    isExtended: context?.isExtended(),
    extendedOnly: registration.extendedOnly,
    isSelected,
    className: mergeClassNames<NavigationRailItemInterface>('navigationRailItem', classes, hostClass),
  }));

  let root: HTMLElement | undefined = $state();
  let horizontalLabel: HTMLSpanElement | undefined = $state();
  let verticalLabel: HTMLSpanElement | undefined = $state();
  let horizontalController: NavigationRailItemLabelController | undefined;
  let verticalController: NavigationRailItemLabelController | undefined;

  $effect(() => {
    registration.label = label;
    registration.icon = icon;
    registration.element = root;
    if (!context) return;
    const unregister = context.registerItem(registration);
    return unregister;
  });

  $effect(() => {
    if (!horizontalLabel || !verticalLabel) return;
    const horizontal = createNavigationRailItemLabelController({ label: horizontalLabel, axis: () => 'horizontal', visible: () => resolvedVariant === 'horizontal' });
    const vertical = createNavigationRailItemLabelController({ label: verticalLabel, axis: () => 'vertical', visible: () => resolvedVariant === 'vertical' });
    horizontalController = horizontal;
    verticalController = vertical;
    return () => {
      horizontal.destroy();
      vertical.destroy();
      if (horizontalController === horizontal) horizontalController = undefined;
      if (verticalController === vertical) verticalController = undefined;
    };
  });

  $effect(() => {
    void resolvedVariant;
    horizontalController?.update();
    verticalController?.update();
  });

  const handleClick = (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => {
    if (resolvedIndex != null) context?.select(resolvedIndex);
    if (resolvedIndex != null && isSelected) onItemSelected?.({ index: resolvedIndex, label, icon });
    onclick?.(event);
  };
</script>

{#if !hidden}
  {#if href !== undefined}
    <a
      {...rest}
      bind:this={root}
      class={styles.current['navigationRailItem']}
      style={`${hostStyle ?? ''}${hostStyle && !hostStyle.endsWith(';') ? ';' : ''}transition: 0.3s`}
      href={href}
      aria-current={isSelected ? 'page' : undefined}
      onclick={handleClick}
    >
      {@render content()}
    </a>
  {:else}
    <button
      {...rest}
      bind:this={root}
      type="button"
      class={styles.current['navigationRailItem']}
      style={`${hostStyle ?? ''}${hostStyle && !hostStyle.endsWith(';') ? ';' : ''}transition: 0.3s`}
      aria-current={isSelected ? 'page' : undefined}
      onclick={handleClick}
    >
      {@render content()}
    </button>
  {/if}
{/if}

{#snippet content()}
  <span class={styles.current['container']} style:transition={resolvedVariant === 'horizontal' ? '0.3s, gap 0.15s 0.15s' : '0.3s, gap 0.1s 0.2s'}>
    <StateLayer class={styles.current['stateLayer']} colorName={isSelected ? 'on-secondary-container' : 'on-surface'} stateClassName="state-ripple-group-[navigation-rail-item]" />
    {#if icon}
      {#if badge}
        <Badge {...badge} visible={badge !== undefined}><Icon icon={isSelected ? (iconSelected ?? icon) : icon} class={styles.current['icon']} /></Badge>
      {:else}
        <Icon icon={isSelected ? (iconSelected ?? icon) : icon} class={styles.current['icon']} />
      {/if}
    {/if}
    <span bind:this={horizontalLabel} class={styles.current['label']} aria-hidden={resolvedVariant !== 'horizontal'} style={initialHorizontalStyle}>{label}</span>
  </span>
  <span bind:this={verticalLabel} class={styles.current['label']} aria-hidden={resolvedVariant !== 'vertical'} style={initialVerticalStyle}>{label}</span>
{/snippet}
