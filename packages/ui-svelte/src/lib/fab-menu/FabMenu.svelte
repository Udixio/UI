<script module lang="ts">
  let nextFabMenuId = 0;
</script>

<script lang="ts">
  import {
    DEFAULT_FAB_MENU_CLOSE_ICON,
    fabMenuStyle,
    mergeClassNames,
    type ButtonInterface,
    type ClassNameComponent,
    type FabMenuInterface,
    type FabMenuAction,
  } from '@udixio/core';
  import { createFabMenuController, type FabMenuController } from '@udixio/core/dom';
  import Button from '../button/Button.svelte';
  import Fab from '../fab/Fab.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteFabMenuProps } from './fab-menu.types';

  let {
    label,
    icon,
    actions,
    closeIcon = DEFAULT_FAB_MENU_CLOSE_ICON,
    closeLabel = `Close ${label}`,
    actionsLabel = `${label} actions`,
    variant = 'primary',
    size = 'small',
    extended = false,
    disabled = false,
    open = $bindable(),
    defaultOpen = false,
    onOpenChange,
    onActionSelect,
    class: hostClass = '',
    classes,
    ...rest
  }: SvelteFabMenuProps = $props();

  let root: HTMLDivElement | undefined = $state();
  let triggerHost: HTMLSpanElement | undefined = $state();
  let closedTriggerHost: HTMLSpanElement | undefined = $state();
  let openTriggerHost: HTMLSpanElement | undefined = $state();
  let panel: HTMLDivElement | undefined = $state();
  let controller: FabMenuController | undefined;
  const panelId = `fab-menu-${nextFabMenuId++}`;

  const openState = createControllableState({
    value: () => open,
    defaultValue: () => defaultOpen,
    onChange: (next) => onOpenChange?.(next),
    assign: (next) => (open = next),
    componentName: 'FabMenu',
    stateName: 'open',
  });
  const isOpen = $derived(openState.current);
  const hasAccessibleLabel = $derived(label.trim() !== '');
  const resolvedTriggerLabel = $derived(isOpen ? closeLabel : label);
  const resolvedTriggerIcon = $derived(isOpen ? closeIcon : icon);
  const triggerVariant = $derived(
    (isOpen ? variant : `${variant}Container`) as 'primary' | 'secondary' | 'tertiary' | 'primaryContainer' | 'secondaryContainer' | 'tertiaryContainer',
  );
  const closedTriggerVariant = $derived(`${variant}Container` as 'primaryContainer' | 'secondaryContainer' | 'tertiaryContainer');
  const actionStateColor = $derived(`on-${variant}-container`);
  const styles = createStyle(fabMenuStyle, () => ({
    label,
    icon,
    actions,
    closeIcon,
    closeLabel,
    actionsLabel,
    variant,
    size,
    extended,
    disabled,
    open,
    defaultOpen,
    isOpen,
    className: mergeClassNames<FabMenuInterface>('fabMenu', classes, hostClass),
  }));
  const actionClasses: ClassNameComponent<ButtonInterface> = () => ({ button: styles.current['action'] });

  const toggle = () => {
    if (!disabled && hasAccessibleLabel) openState.set(!isOpen);
  };

  const selectAction = (action: FabMenuAction, index: number) => {
    if (disabled || action.disabled) return;
    onActionSelect?.(action, index);
    controller?.restoreFocusOnClose();
    openState.set(false);
  };

  $effect(() => {
    if (!root || !triggerHost || !closedTriggerHost || !openTriggerHost || !panel) return;
    const trigger = triggerHost.querySelector<HTMLElement>('button, a');
    const closedTrigger = closedTriggerHost.querySelector<HTMLElement>('button, a');
    const openTrigger = openTriggerHost.querySelector<HTMLElement>('button, a');
    if (!trigger || !closedTrigger || !openTrigger) return;
    const created = createFabMenuController({
      root,
      trigger,
      closedTrigger,
      openTrigger,
      panel,
      onDismiss: () => openState.set(false),
    });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => {
    controller?.setOpen(isOpen);
  });

  $effect(() => () => controller?.destroy());
</script>

{#if hasAccessibleLabel}
  <div
    {...rest}
    bind:this={root}
    class={styles.current['fabMenu']}
    data-open={isOpen}
  >
    <span bind:this={closedTriggerHost} class={styles.current['triggerSizer']} aria-hidden="true" inert>
      <Fab label={label} {icon} variant={closedTriggerVariant} {size} {extended} disabled tabindex={-1} />
      <span bind:this={openTriggerHost} class={styles.current['triggerPositioner']}>
        <Fab label={closeLabel} icon={closeIcon} variant={variant} size="small" disabled tabindex={-1} />
      </span>
    </span>

    <span bind:this={triggerHost} class={styles.current['triggerPositioner']}>
      <Fab
        label={resolvedTriggerLabel}
        icon={resolvedTriggerIcon}
        variant={triggerVariant}
        size={isOpen ? 'small' : size}
        extended={extended && !isOpen}
        {disabled}
        class={styles.current['fab']}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onclick={toggle}
      />
    </span>

    <div
      bind:this={panel}
      id={panelId}
      class={styles.current['actions']}
      role="group"
      aria-label={actionsLabel}
      aria-hidden={!isOpen || undefined}
      inert={!isOpen}
    >
      {#each actions as action, index (action.id)}
        <span class={styles.current['actionContainer']} data-fab-menu-action>
          <Button
            label={action.label}
            icon={action.icon}
            href={action.href}
            disabled={disabled || !!action.disabled}
            variant="filled"
            shape="rounded"
            classes={actionClasses}
            stateColor={actionStateColor}
            onclick={() => selectAction(action, index)}
          />
        </span>
      {/each}
    </div>
  </div>
{:else}
  <!-- A FAB menu without an accessible trigger has no usable surface. -->
{/if}
