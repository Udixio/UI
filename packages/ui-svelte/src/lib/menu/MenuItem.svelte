<script lang="ts">
  import {
    getMenuItemRole,
    getMenuItemSelectionTransition,
    menuItemStyle,
    mergeClassNames,
    type MenuItemInterface,
  } from '@udixio/core';
  import { iCheck } from '@udixio/icons-rounded-400/check';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getMenuContext } from './menu-context.svelte';
  import type { SvelteMenuItemProps } from './menu-item.types';

  let {
    label,
    children,
    value,
    leadingIcon,
    trailingIcon,
    disabled = false,
    variant,
    selectionType,
    selected = $bindable(),
    defaultSelected = false,
    onSelectedChange,
    href,
    class: hostClass = '',
    classes,
    onclick,
    ...rest
  }: SvelteMenuItemProps = $props();

  const context = getMenuContext();
  const purpose = $derived(context?.purpose() ?? 'actions');
  const resolvedVariant = $derived(variant ?? context?.variant() ?? 'standard');
  const resolvedSelectionType = $derived(selectionType ?? (purpose === 'selection' ? 'single' : 'none'));
  const role = $derived(getMenuItemRole({ purpose, selectionType: resolvedSelectionType }));
  const selectedState = createControllableState({
    value: () => selected,
    defaultValue: () => defaultSelected,
    onChange: (next) => onSelectedChange?.(next),
    assign: (next) => (selected = next),
    componentName: 'MenuItem',
    stateName: 'selected',
  });
  const isSelected = $derived(selectedState.current);
  const resolvedLeadingIcon = $derived(isSelected && resolvedSelectionType !== 'none' ? iCheck : leadingIcon);
  const styles = createStyle(menuItemStyle, () => ({
    label,
    value,
    leadingIcon,
    trailingIcon,
    disabled,
    variant: resolvedVariant,
    selectionType: resolvedSelectionType,
    selected,
    defaultSelected,
    onSelectedChange,
    isSelected,
    purpose,
    className: mergeClassNames<MenuItemInterface>('menuItem', classes, hostClass),
  }));

  const activate = (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    const transition = getMenuItemSelectionTransition({ disabled, selectionType: resolvedSelectionType, selected: isSelected });
    if (transition.nextSelected !== undefined) selectedState.set(transition.nextSelected);
    onclick?.(event);
  };
</script>

{#if href !== undefined}
  <a
    {...rest}
    class={styles.current['menuItem']}
    role={role}
    href={disabled ? undefined : href}
    aria-disabled={disabled || undefined}
    aria-selected={role === 'option' ? isSelected : undefined}
    aria-checked={role === 'menuitemcheckbox' || role === 'menuitemradio' ? isSelected : undefined}
    data-menu-disabled={disabled ? 'true' : undefined}
    tabindex={disabled ? -1 : 0}
    onclick={activate}
  >
    {@render content()}
  </a>
{:else}
  <button
    {...rest}
    type="button"
    class={styles.current['menuItem']}
    role={role}
    disabled={disabled}
    value={value}
    aria-selected={role === 'option' ? isSelected : undefined}
    aria-checked={role === 'menuitemcheckbox' || role === 'menuitemradio' ? isSelected : undefined}
    data-menu-disabled={disabled ? 'true' : undefined}
    tabindex={disabled ? -1 : 0}
    onclick={activate}
  >
    {@render content()}
  </button>
{/if}

{#snippet content()}
  {#if !disabled}
    <StateLayer
      class={styles.current['stateLayer']}
      colorName={resolvedVariant === 'vibrant' || isSelected ? 'on-tertiary-container' : 'on-secondary-container'}
      stateClassName="state-ripple-group-[menu-item]"
    />
  {/if}
  {#if resolvedLeadingIcon}
    <span aria-hidden="true" class={`${styles.current['itemIcon']} ${styles.current['leadingIcon']} z-10 relative`}>
      <Icon icon={resolvedLeadingIcon} />
    </span>
  {/if}
  <span class={`${styles.current['itemLabel']} z-10 relative`}>{#if children}{@render children()}{:else}{label}{/if}</span>
  {#if trailingIcon}
    <span aria-hidden="true" class={`${styles.current['itemIcon']} ${styles.current['trailingIcon']} z-10 relative`}><Icon icon={trailingIcon} /></span>
  {/if}
{/snippet}
