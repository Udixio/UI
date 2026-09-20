<script lang="ts">
  import {
    chipStyle,
    classNames,
    getChipSelectionTransition,
    mergeClassNames,
    type ChipInterface,
  } from '@udixio/core';
  import { iCheck } from '@udixio/icons-rounded-400/check';
  import { iClose } from '@udixio/icons-rounded-400/close';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteChipProps } from './chip.types';

  let {
    label,
    children,
    variant = 'outlined',
    disabled = false,
    icon,
    href,
    selected = $bindable(),
    defaultSelected,
    onSelectedChange,
    onRemove,
    draggable = false,
    editable = false,
    editing,
    onEditStart,
    onEditCommit,
    onEditCancel,
    onChange,
    transition,
    class: hostClass = '',
    style: hostStyle,
    classes,
    onclick,
    onfocus,
    onblur,
    onkeydown,
    ondblclick,
    ondragstart,
    ondragend,
    ...rest
  }: SvelteChipProps = $props();

  let rootElement: HTMLButtonElement | HTMLAnchorElement | undefined = $state();
  let labelElement: HTMLSpanElement | undefined = $state();
  let isFocused = $state(false);
  let isDragging = $state(false);
  let internalEditing = $state(false);
  let editValue = $state('');
  let editTimer: ReturnType<typeof setTimeout> | undefined;

  const isSelectable = $derived(
    selected !== undefined || defaultSelected !== undefined || onSelectedChange !== undefined,
  );
  const isInteractive = $derived(
    isSelectable || !!onRemove || !!onclick || !!href || editable,
  );
  const isEditing = $derived(!!editable && (editing ?? internalEditing));
  const hasTrailingIcon = $derived(!!onRemove && !isEditing);
  const resolvedDuration = $derived(transition?.duration ?? 0.3);

  const selectedState = createControllableState({
    value: () => selected,
    defaultValue: () => defaultSelected ?? false,
    onChange: (next) => onSelectedChange?.(next),
    assign: (next) => (selected = next),
    componentName: 'Chip',
    stateName: 'selected',
  });
  const isSelected = $derived(selectedState.current);
  const resolvedIcon = $derived(isSelected ? iCheck : icon);

  const styles = createStyle(chipStyle, () => ({
    transition,
    label,
    variant,
    disabled,
    icon: resolvedIcon,
    selected,
    defaultSelected,
    onSelectedChange,
    onRemove,
    href,
    draggable,
    editable,
    editing,
    onEditStart,
    onEditCommit,
    onEditCancel,
    onChange,
    isSelected,
    isFocused,
    isInteractive,
    isDragging,
    isEditing,
    trailingIcon: hasTrailingIcon,
    className: mergeClassNames<ChipInterface>('chip', classes, hostClass),
  }));

  const clearEditTimer = () => {
    if (editTimer) clearTimeout(editTimer);
    editTimer = undefined;
  };

  const enterEditing = (event?: Event, delayed = false) => {
    if (disabled || !editable || isEditing) return;
    event?.preventDefault();
    editValue = label ?? '';
    const activate = () => {
      if (disabled || (draggable && isDragging)) return;
      if (editing === undefined) internalEditing = true;
      onEditStart?.();
      requestAnimationFrame(() => {
        labelElement?.focus();
        const selection = window.getSelection();
        if (!selection || !labelElement) return;
        const range = document.createRange();
        range.selectNodeContents(labelElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    };
    if (delayed) {
      clearEditTimer();
      editTimer = setTimeout(activate, 1000);
    } else activate();
  };

  const commitEditing = () => {
    const next = editValue.trim();
    if (editing === undefined) internalEditing = false;
    if (!next) {
      onRemove?.();
      return;
    }
    onEditCommit?.(next);
  };

  const handleClick = (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (isSelectable) {
      const transitionResult = getChipSelectionTransition({ disabled, selected: isSelected });
      if (transitionResult.nextSelected !== undefined) selectedState.set(transitionResult.nextSelected);
    }
    if (!isEditing) onclick?.(event);
  };

  const handleFocus = (event: FocusEvent) => {
    if (isInteractive) {
      isFocused = true;
      if (editable && !isEditing) enterEditing(undefined, true);
    }
    onfocus?.(event);
  };

  const handleBlur = (event: FocusEvent) => {
    const related = event.relatedTarget;
    if (related instanceof Node && rootElement?.contains(related)) return;
    clearEditTimer();
    isFocused = false;
    if (isEditing) commitEditing();
    onblur?.(event);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled) {
      onkeydown?.(event);
      return;
    }
    if (isEditing) {
      if (event.key === 'Enter') {
        event.preventDefault();
        commitEditing();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        if (editing === undefined) internalEditing = false;
        onEditCancel?.();
      } else if (onRemove && !editValue.trim() && ['Backspace', 'Delete', 'Del'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        onRemove();
      }
      onkeydown?.(event);
      return;
    }
    if (isFocused && editable && !isSelectable && ['F2', 'Enter'].includes(event.key)) {
      enterEditing(event);
      onkeydown?.(event);
      return;
    }
    if (isFocused && isSelectable && ['Enter', ' ', 'Spacebar'].includes(event.key)) {
      event.preventDefault();
      const transitionResult = getChipSelectionTransition({ disabled, selected: isSelected });
      if (transitionResult.nextSelected !== undefined) selectedState.set(transitionResult.nextSelected);
    }
    if (isFocused && onRemove && ['Backspace', 'Delete', 'Del'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      onRemove();
    }
    onkeydown?.(event);
  };

  const handleInput = () => {
    if (!isEditing || !labelElement) return;
    editValue = labelElement.innerText;
    onChange?.(editValue);
  };

  const handleDoubleClick = (event: MouseEvent) => {
    if (!disabled && editable && !isEditing) enterEditing(event);
    ondblclick?.(event);
  };

  const handleDragStart = (event: DragEvent) => {
    if (!disabled && draggable) isDragging = true;
    ondragstart?.(event);
  };

  const handleDragEnd = (event: DragEvent) => {
    if (draggable) isDragging = false;
    ondragend?.(event);
  };

  $effect(() => () => clearEditTimer());
</script>

{#if href !== undefined}
  <a
    {...rest}
    bind:this={rootElement}
    class={styles.current['chip']}
    style={`${hostStyle ?? ''}${hostStyle && !hostStyle.endsWith(';') ? ';' : ''}transition: ${resolvedDuration}s`}
    href={disabled ? undefined : href}
    aria-disabled={disabled || undefined}
    aria-pressed={isSelectable ? isSelected : undefined}
    role={isSelectable ? 'button' : undefined}
    draggable={!disabled && draggable}
    tabindex={disabled ? -1 : undefined}
    onfocus={handleFocus}
    onblur={handleBlur}
    onclick={handleClick}
    ondblclick={handleDoubleClick}
    onkeydown={handleKeydown}
    ondragstart={handleDragStart}
    ondragend={handleDragEnd}
  >
    {@render content()}
  </a>
{:else}
  <button
    {...rest}
    bind:this={rootElement}
    type="button"
    class={styles.current['chip']}
    style={`${hostStyle ?? ''}${hostStyle && !hostStyle.endsWith(';') ? ';' : ''}transition: ${resolvedDuration}s`}
    disabled={disabled}
    aria-pressed={isSelectable ? isSelected : undefined}
    draggable={!disabled && draggable}
    onfocus={handleFocus}
    onblur={handleBlur}
    onclick={handleClick}
    ondblclick={handleDoubleClick}
    onkeydown={handleKeydown}
    ondragstart={handleDragStart}
    ondragend={handleDragEnd}
  >
    {@render content()}
  </button>
{/if}

{#snippet content()}
  {#if isInteractive && !disabled && !isEditing}
    <StateLayer
      transitionDuration={resolvedDuration}
      class={styles.current['stateLayer']}
      colorName={classNames({
        'on-surface-variant': !isSelected,
        'on-secondary-container': isSelected,
      })}
      stateClassName="state-ripple-group-[chip]"
    />
  {/if}
  {#if resolvedIcon}
    <Icon icon={resolvedIcon} class={styles.current['leadingIcon']} />
  {/if}
  <span
    bind:this={labelElement}
    class={styles.current['label']}
    contenteditable={editable && isEditing}
    role={editable ? 'textbox' : undefined}
    spellcheck={editable && isEditing ? false : undefined}
    oninput={handleInput}
    onblur={(event) => editable && isEditing && handleBlur(event)}
  >
    {#if isEditing}{editValue}{:else if children}{@render children()}{:else}{label}{/if}
  </span>
  {#if hasTrailingIcon}
    <span
      aria-hidden="true"
      class={styles.current['trailingIcon']}
      onmousedown={(event) => { event.preventDefault(); event.stopPropagation(); }}
      onclick={(event) => { event.stopPropagation(); if (!disabled) onRemove?.(); }}
    >
      <Icon icon={iClose} class="size-full" />
    </span>
  {/if}
{/snippet}
