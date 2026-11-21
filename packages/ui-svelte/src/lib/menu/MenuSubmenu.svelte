<script lang="ts">
  import {
    menuItemStyle,
    mergeClassNames,
    type MenuItemInterface,
  } from '@udixio/core';
  import {
    createAnchorPositionerController,
    createMenuSubmenuController,
    createMenuTransitionController,
    type MenuTransitionController,
  } from '@udixio/core/dom';
  import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
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
    lazy = false,
    children,
    class: hostClass = '',
    triggerClasses,
    ...rest
  }: SvelteMenuSubmenuProps = $props();

  const context = getMenuContext();
  const resolvedVariant = $derived(variant ?? context?.variant() ?? 'standard');
  let open = $state(false);
  // Whether the closed nested menu has finished its exit: until then it stays shown (inert), then it is hidden.
  let exited = $state(true);
  const shown = $derived(open || !exited);
  let transition: MenuTransitionController | undefined;
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
        if (disabled) return;
        exited = false;
        open = true;
      },
      onClose: () => (open = false),
    });
    return () => created.destroy();
  });

  // One motion per nested menu element: it grows from the trigger as it opens and shrinks back as it closes.
  $effect(() => {
    const menu = surface?.querySelector<HTMLElement>('[role="menu"]');
    if (!trigger || !menu) return;
    const created = createMenuTransitionController({
      menu,
      anchor: trigger,
      onExited: () => {
        if (!open) exited = true;
      },
    });
    transition = created;
    return () => {
      created.destroy();
      if (transition === created) transition = undefined;
    };
  });

  // Positioned against the trigger while shown, open or leaving; the surface stays in place in the DOM, so its links
  // are in the server HTML while it is closed. The motion measures the placed menu for its origin.
  $effect(() => {
    const isOpenNow = open;
    if (!shown || !trigger || !surface) return;
    const positioned = createAnchorPositionerController({
      anchor: trigger,
      floating: surface,
      position: () => 'auto',
      autoAxis: () => 'horizontal',
      inheritThemeScope: false,
    });
    transition?.setOpen(isOpenNow);
    return () => positioned.destroy();
  });
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
  {#if !lazy || shown}
    <div bind:this={surface} hidden={!shown} inert={!open} style="z-index: 50" data-menu-submenu-surface>
      <Menu
        purpose="actions"
        variant={resolvedVariant}
        accessibleLabel={accessibleLabel ?? `${label} submenu`}
      >
        {@render children?.()}
      </Menu>
    </div>
  {/if}
</div>
