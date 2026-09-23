<script lang="ts">
  import {
    mergeClassNames,
    splitToolbarActions,
    toolbarStyle,
    type AnchorPosition,
    type ToolbarInterface,
  } from '@udixio/core';
  import { iMoreVert } from '@udixio/icons-rounded-400/more_vert';
  import AnchorPositioner from '../anchor-positioner/AnchorPositioner.svelte';
  import IconButton from '../icon-button/IconButton.svelte';
  import Menu from '../menu/Menu.svelte';
  import MenuItem from '../menu/MenuItem.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type {
    SvelteToolbarAction,
    SvelteToolbarMoreContext,
    SvelteToolbarProps,
  } from './toolbar.types';

  let {
    variant = 'docked',
    color = 'standard',
    orientation = 'horizontal',
    accessibleLabel,
    actions,
    maxVisible,
    responsive = false,
    itemWidth = 48,
    more,
    morePosition = 'auto',
    moreTemplate,
    onMoreOpenChange,
    class: hostClass = '',
    classes,
    children,
    'aria-label': ariaLabel,
    'aria-orientation': ariaOrientation,
    onkeydown,
    ...rest
  }: SvelteToolbarProps = $props();

  let root: HTMLDivElement | undefined = $state();
  let moreTrigger: HTMLSpanElement | undefined = $state();
  let menu: HTMLDivElement | undefined = $state();
  let availableWidth = $state(Number.POSITIVE_INFINITY);
  let open = $state(false);

  const styles = createStyle(toolbarStyle, () => ({
    variant,
    color,
    orientation,
    accessibleLabel,
    actions,
    maxVisible,
    responsive,
    itemWidth,
    more,
    morePosition,
    isOverflowOpen: open,
    className: mergeClassNames<ToolbarInterface>('toolbar', classes, hostClass),
  }));

  const split = $derived(
    splitToolbarActions({
      actions: actions ?? [],
      maxVisible,
      responsive,
      availableWidth,
      itemWidth,
    }),
  );
  const visibleActions = $derived(split.visible as readonly SvelteToolbarAction[]);
  const overflowActions = $derived(split.overflow as readonly SvelteToolbarAction[]);
  const moreLabel = $derived(more?.label ?? 'More actions');
  const moreIcon = $derived(more?.icon ?? iMoreVert);
  const moreVariant = $derived(more?.variant ?? 'standard');
  const moreSize = $derived(more?.size ?? 'small');

  $effect(() => {
    if (!responsive || actions === undefined || !root || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) availableWidth = entry.contentRect.width;
    });
    observer.observe(root);
    return () => observer.disconnect();
  });

  $effect(() => {
    if (overflowActions.length === 0 && open) {
      open = false;
      onMoreOpenChange?.(false);
    }
  });

  $effect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (moreTrigger?.contains(target) || menu?.contains(target)) return;
      open = false;
      onMoreOpenChange?.(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      open = false;
      onMoreOpenChange?.(false);
      moreTrigger?.querySelector<HTMLElement>('button, a')?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  });

  const toggleMore = () => {
    if (overflowActions.length === 0) return;
    open = !open;
    onMoreOpenChange?.(open);
  };

  const closeMore = () => {
    if (!open) return;
    open = false;
    onMoreOpenChange?.(false);
  };

  const runAction = (action: SvelteToolbarAction) => {
    if (action.href === undefined) action.onClick?.();
  };

  const selectAction = (action: SvelteToolbarAction) => {
    if (action.disabled) return;
    runAction(action);
    closeMore();
  };

  const moreContext: SvelteToolbarMoreContext = $derived({
    actions: overflowActions,
    label: moreLabel,
    icon: moreIcon,
    variant: moreVariant,
    size: moreSize,
    open,
    ariaHasPopup: 'menu',
    ariaExpanded: open,
    toggle: toggleMore,
  });
</script>

<div
  bind:this={root}
  {...rest}
  class={styles.current['toolbar']}
  role="toolbar"
  data-udx-toolbar-variant={variant}
  data-udx-toolbar-orientation={orientation}
  aria-label={accessibleLabel ?? ariaLabel}
  aria-orientation={ariaOrientation ?? (orientation === 'vertical' ? 'vertical' : undefined)}
  {onkeydown}
>
  {#if actions !== undefined}
    {#each visibleActions as action (action.id)}
      <IconButton
        label={action.label}
        icon={action.icon}
        tooltip={action.tooltip}
        pressedIcon={action.pressedIcon}
        variant={action.variant}
        size={action.size ?? 'small'}
        width={action.width}
        disabled={action.disabled}
        shape={action.shape}
        shapeFeedback={action.shapeFeedback}
        transition={action.transition}
        toggleable={action.toggleable}
        pressed={action.pressed}
        defaultPressed={action.defaultPressed}
        href={action.href}
        onclick={() => runAction(action)}
        onPressedChange={action.onToggle}
      />
    {/each}
    {#if overflowActions.length > 0}
      <span bind:this={moreTrigger} class="shrink-0">
        {#if moreTemplate}
          {@render moreTemplate(moreContext)}
        {:else}
          <IconButton
            label={moreLabel}
            icon={moreIcon}
            tooltip={false}
            variant={moreVariant}
            size={moreSize}
            aria-haspopup="menu"
            aria-expanded={open}
            onclick={toggleMore}
          />
        {/if}
      </span>
    {/if}
  {:else}
    {@render children?.()}
  {/if}
</div>

{#if open && overflowActions.length > 0 && moreTrigger}
  <AnchorPositioner
    anchor={moreTrigger}
    position={morePosition as AnchorPosition}
    autoAxis={orientation === 'vertical' ? 'horizontal' : 'vertical'}
  >
    <div bind:this={menu}>
      <Menu purpose="actions" accessibleLabel={moreLabel} initialFocus="first">
        {#each overflowActions as action (action.id)}
          <MenuItem
            label={action.label}
            leadingIcon={action.icon}
            href={action.href}
            disabled={action.disabled}
            onclick={() => selectAction(action)}
          />
        {/each}
      </Menu>
    </div>
  </AnchorPositioner>
{/if}
