<script lang="ts">
  import {
    getIconButtonPressTransition,
    getIconButtonShapeTransition,
    getIconButtonStateColor,
    iconButtonStyle,
    mergeClassNames,
    type IconButtonInterface,
  } from '@udixio/core';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { tooltip as tooltipAttachment } from '../tooltip/tooltip.attachment.svelte';
  import type { SvelteIconButtonProps } from './icon-button.types';

  let {
    variant = 'standard',
    disabled = false,
    label,
    icon,
    tooltip,
    pressedIcon,
    size = 'medium',
    width = 'default',
    shape = 'rounded',
    shapeFeedback = 'morph',
    transition,
    toggleable = false,
    pressed = $bindable(),
    defaultPressed = false,
    onPressedChange,
    class: hostClass = '',
    classes,
    href,
    target,
    rel,
    type = 'button',
    title,
    onclick,
    ...rest
  }: SvelteIconButtonProps = $props();

  const isToggleButton = $derived(toggleable && href === undefined);
  const pressedState = createControllableState({
    value: () => pressed,
    defaultValue: () => defaultPressed,
    onChange: (next) => onPressedChange?.(next),
    assign: (next) => (pressed = next),
    componentName: 'IconButton',
    stateName: 'pressed',
  });
  const isPressed = $derived(isToggleButton && pressedState.current);
  const tooltipText = $derived(tooltip === false ? undefined : (tooltip ?? title ?? label));
  const hasAccessibleLabel = $derived(label.trim() !== '');

  const shapeTransition = $derived(
    getIconButtonShapeTransition({ size, shape, shapeFeedback, isPressed, disabled, transition }),
  );
  const styles = createStyle(iconButtonStyle, () => ({
    label,
    icon,
    tooltip,
    pressedIcon,
    size,
    width,
    variant,
    disabled,
    shape,
    shapeFeedback,
    transition,
    toggleable: isToggleButton,
    pressed,
    defaultPressed,
    isPressed,
    className: mergeClassNames<IconButtonInterface>('iconButton', classes, hostClass),
  }));

  $effect(() => {
    if (hasAccessibleLabel) return;
    console.error('Udixio UI: <IconButton> requires a non-empty `label`. Rendering nothing.');
  });

  const handleClick = (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => {
    const interaction = getIconButtonPressTransition({
      disabled,
      toggleable: isToggleButton,
      isPressed,
    });
    if (interaction.blocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (interaction.nextPressed !== undefined) pressedState.set(interaction.nextPressed);
    onclick?.(event);
  };

  // The tooltip is the label's visual echo: it describes the target only when
  // it says something else, and stays silent on a disabled control.
  const tooltipOptions = () => ({
    text: tooltipText,
    trigger: disabled ? null : undefined,
    describeTarget: tooltipText !== label,
  });
</script>

{#snippet content()}
  <span class={styles.current['touchTarget']}></span>
  <StateLayer
    {shapeTransition}
    class={styles.current['stateLayer']}
    colorName={getIconButtonStateColor({ variant, toggleable: isToggleButton, isPressed })}
    stateClassName="state-ripple-group-[icon-button]"
  />
  <Icon icon={isPressed && pressedIcon ? pressedIcon : icon} class={styles.current['icon']} />
{/snippet}

{#if !hasAccessibleLabel}
  <!-- No accessible name: render nothing, as React does. -->
{:else if href !== undefined}
  <a
    {...rest}
    {@attach tooltipAttachment(tooltipOptions)}
    class={styles.current['iconButton']}
    href={disabled ? undefined : href}
    {target}
    {rel}
    aria-label={label}
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
    class={styles.current['iconButton']}
    aria-label={label}
    aria-pressed={isToggleButton ? isPressed : undefined}
    onclick={handleClick}
  >
    {@render content()}
  </button>
{/if}
