<script lang="ts">
  import { resolveTabSelection, tabStyle, mergeClassNames, type TabInterface } from '@udixio/core';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getTabsContext, type TabRegistration } from './tabs-context.svelte';
  import type { SvelteTabProps } from './tab.types';

  let { label, icon, children, disabled = false, href, class: hostClass = '', classes, onclick, ...rest }: SvelteTabProps = $props();
  const context = getTabsContext();
  const registration = $state<TabRegistration>({ label: undefined, icon: undefined, disabled: false });
  const resolvedIndex = $derived(context?.indexOf(registration));
  const selectedIndex = $derived(context?.selectedIndex() ?? null);
  const isSelected = $derived(resolveTabSelection({ selectedTab: selectedIndex, index: resolvedIndex }));
  const isFocusable = $derived(resolvedIndex != null && context?.focusableIndex() === resolvedIndex);
  const variant = $derived(context?.variant() ?? 'primary');
  const tabsId = $derived(context?.tabsId());
  const domId = $derived(tabsId !== undefined && resolvedIndex !== undefined ? `tab-${tabsId}-${resolvedIndex}` : undefined);
  const panelId = $derived(context?.hasPanels() && tabsId !== undefined && resolvedIndex !== undefined ? `tabpanel-${tabsId}-${resolvedIndex}` : undefined);
  const resolvedLabel = $derived(label ?? (children === undefined ? undefined : label));

  const styles = createStyle(tabStyle, () => ({
    label: resolvedLabel,
    icon,
    variant,
    disabled,
    index: resolvedIndex,
    selectedTab: selectedIndex,
    tabsId,
    isSelected,
    className: mergeClassNames<TabInterface>('tab', classes, hostClass),
  }));

  let root: HTMLElement | undefined = $state();
  let content: HTMLSpanElement | undefined = $state();
  $effect(() => {
    registration.element = root;
    registration.content = content;
    registration.label = label;
    registration.icon = icon;
    registration.disabled = disabled;
    if (!context) return;
    const unregister = context.registerTab(registration);
    return unregister;
  });

  const handleClick = (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => {
    if (disabled) {
      if (href !== undefined) event.preventDefault();
      return;
    }
    if (resolvedIndex != null) context?.select(resolvedIndex);
    onclick?.(event);
  };
</script>

{#if href !== undefined}
  <a
    {...rest}
    bind:this={root}
    role="tab"
    id={domId}
    aria-selected={isSelected}
    aria-controls={panelId}
    aria-disabled={disabled || undefined}
    tabindex={disabled ? -1 : (isSelected || isFocusable ? 0 : -1)}
    href={disabled ? undefined : href}
    class={styles.current['tab']}
    onclick={handleClick}
  >
    {@render contentMarkup()}
  </a>
{:else}
  <button
    {...rest}
    bind:this={root}
    type="button"
    role="tab"
    id={domId}
    aria-selected={isSelected}
    aria-controls={panelId}
    disabled={disabled}
    tabindex={disabled ? -1 : (isSelected || isFocusable ? 0 : -1)}
    class={styles.current['tab']}
    onclick={handleClick}
  >
    {@render contentMarkup()}
  </button>
{/if}

{#snippet contentMarkup()}
  <StateLayer
    transitionDuration={0.3}
    class={styles.current['stateLayer']}
    colorName={variant === 'primary' && isSelected ? 'primary' : 'on-surface'}
    stateClassName="state-ripple-group-[tab]"
  />
  <span bind:this={content} class={styles.current['content']}>
    {#if icon}<Icon icon={icon} class={styles.current['icon']} />{/if}
    <span class={styles.current['label']}>{#if children}{@render children()}{:else}{label}{/if}</span>
  </span>
{/snippet}
