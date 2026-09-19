<script lang="ts">
  import { untrack } from 'svelte';
  import { fabStyle, mergeClassNames, type FabInterface } from '@udixio/core';
  import {
    createFabLabelController,
    type FabLabelController,
  } from '@udixio/core/dom';
  import { createStyle } from '../utils/create-style.svelte';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { tooltip as tooltipAttachment } from '../tooltip/tooltip.attachment.svelte';
  import type { SvelteFabProps } from './fab.types';

  let {
    label,
    icon,
    variant = 'primary',
    size = 'small',
    tooltip,
    extended = false,
    disabled = false,
    class: hostClass = '',
    classes,
    href,
    target,
    rel,
    title,
    type = 'button',
    onclick,
    ...rest
  }: SvelteFabProps = $props();

  const hasAccessibleLabel = $derived(label.trim() !== '');
  const tooltipText = $derived(
    extended || tooltip === false ? undefined : (tooltip ?? title ?? label),
  );
  const stateColor = $derived(
    variant === 'primary'
      ? 'on-primary'
      : variant === 'primaryContainer'
        ? 'on-primary-container'
        : variant === 'secondary'
          ? 'on-secondary'
          : variant === 'secondaryContainer'
            ? 'on-secondary-container'
            : variant === 'tertiary'
              ? 'on-tertiary'
              : 'on-tertiary-container',
  );
  const styles = createStyle(fabStyle, () => ({
    label,
    icon,
    variant,
    size,
    tooltip,
    extended,
    disabled,
    className: mergeClassNames<FabInterface>('fab', classes, hostClass),
  }));

  // The controller owns width and opacity after the initial paint. Keeping
  // these values outside the reactive props prevents Svelte from writing the
  // target state over Anime.js while an interrupted transition is running.
  const initiallyExtended = untrack(() => extended);
  const initialLabelStyle = initiallyExtended
    ? { width: 'auto', opacity: '1' }
    : { width: '0px', opacity: '0' };

  let labelElement: HTMLSpanElement | undefined = $state();
  let labelController: FabLabelController | undefined;

  $effect(() => {
    if (!labelElement) return;
    const element = labelElement;
    const created = createFabLabelController({
      label: element,
      extended: () => extended,
    });
    labelController = created;

    return () => {
      created.destroy();
      if (labelController === created) labelController = undefined;
    };
  });

  // The first call is a no-op because the controller captured the initial
  // state. Later changes are the only ones that animate the label.
  $effect(() => {
    void extended;
    labelController?.update();
  });

  $effect(() => {
    if (hasAccessibleLabel) return;
    console.error('Udixio UI: <Fab> requires a non-empty `label`. Rendering nothing.');
  });

  const handleClick = (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onclick?.(event);
  };

  const tooltipOptions = () => ({
    text: tooltipText,
    trigger: disabled ? null : undefined,
    describeTarget: tooltipText !== label,
  });
</script>

{#snippet content()}
  <span class={styles.current['touchTarget']}></span>
  <StateLayer
    class={styles.current['stateLayer']}
    colorName={stateColor}
    stateClassName="state-ripple-group-[fab]"
  />
  <Icon {icon} class={styles.current['icon']} />
  <span
    bind:this={labelElement}
    class={styles.current['label']}
    aria-hidden={!extended || undefined}
    style:width={initialLabelStyle.width}
    style:opacity={initialLabelStyle.opacity}
  >{label}</span>
{/snippet}

{#if !hasAccessibleLabel}
  <!-- No accessible name: render nothing, as React does. -->
{:else if href !== undefined}
  <a
    {...rest}
    {@attach tooltipAttachment(tooltipOptions)}
    class={styles.current['fab']}
    href={disabled ? undefined : href}
    {target}
    {rel}
    {title}
    aria-label={extended ? undefined : label}
    aria-disabled={disabled || undefined}
    tabindex={disabled ? -1 : rest.tabindex}
    role={disabled ? 'link' : rest.role}
    onclick={handleClick}
  >
    {@render content()}
  </a>
{:else}
  <button
    {...rest}
    {@attach tooltipAttachment(tooltipOptions)}
    {type}
    {disabled}
    class={styles.current['fab']}
    {title}
    aria-label={extended ? undefined : label}
    onclick={handleClick}
  >
    {@render content()}
  </button>
{/if}
