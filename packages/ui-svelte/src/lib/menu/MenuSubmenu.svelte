<script lang="ts">
  import {
    menuItemStyle,
    mergeClassNames,
    type MenuItemInterface,
  } from '@udixio/core';
  import { createMenuSubmenuController } from '@udixio/core/dom';
  import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
  import AnchorPositioner from '../anchor-positioner/AnchorPositioner.svelte';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { getMenuContext } from './menu-context.svelte';
  import type { SvelteMenuSubmenuProps } from './menu-submenu.types';
  import Menu from './Menu.svelte';

  let {
    label,
    leadingIcon,
    disabled = false,
    variant,
    accessibleLabel,
    children,
    class: hostClass = '',
    triggerClasses,
    ...rest
  }: SvelteMenuSubmenuProps = $props();

  const context = getMenuContext();
  const resolvedVariant = $derived(variant ?? context?.variant() ?? 'standard');
  let open = $state(false);
  let trigger: HTMLButtonElement | undefined = $state();
  let surface: HTMLDivElement | undefined = $state();
  const interactionState = { openedByHover: false };
  const isOpen = () => open;

  const styles = createStyle(menuItemStyle, () => ({
    label,
    value: undefined,
    leadingIcon,
    trailingIcon: iChevronRight,
    disabled,
    variant: resolvedVariant,
    selectionType: 'none' as const,
    selected: undefined,
    defaultSelected: false,
    onSelectedChange: undefined,
    isSelected: false,
    purpose: 'actions' as const,
    className: mergeClassNames<MenuItemInterface>(
      'menuItem',
      triggerClasses,
      hostClass,
    ),
  }));

  $effect(() => {
    if (!trigger) return;
    const menu = open
      ? surface?.querySelector<HTMLElement>('[role="menu"]')
      : undefined;
    const created = createMenuSubmenuController({
      trigger,
      menu: menu ?? undefined,
      getMenu: () =>
        surface?.querySelector<HTMLElement>('[role="menu"]') ?? undefined,
      interactionState,
      isOpen,
      onOpen: () => {
        if (!disabled) open = true;
      },
      onClose: () => (open = false),
    });
    return () => created.destroy();
  });

  const parentRootId = $derived(
    trigger?.closest<HTMLElement>('[role="menu"]')?.dataset.menuRootId,
  );
</script>

<div {...rest} style="display: contents" data-menu-submenu>
  <button
    bind:this={trigger}
    type="button"
    class={styles.current['menuItem']}
    role="menuitem"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-disabled={disabled || undefined}
    data-menu-disabled={disabled ? 'true' : undefined}
    data-menu-leading-icon={leadingIcon ? 'true' : undefined}
    disabled={disabled}
  >
    {#if !disabled}
      <StateLayer
        class={styles.current['stateLayer']}
        colorName={resolvedVariant === 'vibrant' ? 'on-tertiary-container' : 'on-secondary-container'}
        stateClassName="state-ripple-group-[menu-item]"
      />
    {/if}
    {#if leadingIcon}
      <span aria-hidden="true" data-menu-leading-icon-slot class={`${styles.current['itemIcon']} ${styles.current['leadingIcon']} z-10 relative`}>
        <Icon icon={leadingIcon} />
      </span>
    {:else}
      <span aria-hidden="true" data-menu-leading-icon-slot style="display: none" class={`${styles.current['itemIcon']} ${styles.current['leadingIcon']} z-10 relative`}></span>
    {/if}
    <span class={`${styles.current['itemLabel']} z-10 relative`}>{label}</span>
    <span aria-hidden="true" class={`${styles.current['itemIcon']} ${styles.current['trailingIcon']} z-10 relative rtl:rotate-180`}>
      <Icon icon={iChevronRight} />
    </span>
  </button>
  {#if open && trigger}
    <AnchorPositioner
      anchor={trigger}
      position="auto"
      autoAxis="horizontal"
      data-menu-root-id={parentRootId}
      data-menu-submenu-surface
    >
      <div bind:this={surface} style="display: contents">
        <Menu
          purpose="actions"
          variant={resolvedVariant}
          accessibleLabel={accessibleLabel ?? `${label} submenu`}
        >
          {@render children?.()}
        </Menu>
      </div>
    </AnchorPositioner>
  {/if}
</div>
