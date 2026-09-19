<script lang="ts">
  import {
    buttonStyle,
    getButtonPressTransition,
    getButtonProgressColor,
    getButtonShapeTransition,
    getButtonStateColor,
    mergeClassNames,
    resolveButtonIconPosition,
    type ButtonInterface,
  } from '@udixio/core';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import Icon from '../icon/Icon.svelte';
  import ProgressIndicator from '../progress-indicator/ProgressIndicator.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import type { SvelteButtonProps } from './button.types';

  let {
    variant = 'filled',
    disabled = false,
    type = 'button',
    icon,
    href,
    target,
    rel,
    label,
    edgeAligned = false,
    class: hostClass = '',
    classes,
    iconPosition = 'start',
    loading = false,
    shape = 'rounded',
    toggleable = false,
    pressed = $bindable(),
    defaultPressed = false,
    onPressedChange,
    size = 'medium',
    shapeFeedback = 'morph',
    stateColor,
    transition,
    children,
    onclick,
    ...rest
  }: SvelteButtonProps = $props();

  const hasVisibleLabel = $derived(children !== undefined || (label !== undefined && label !== ''));
  const resolvedIconPosition = $derived(resolveButtonIconPosition(iconPosition));
  const isToggleButton = $derived(toggleable && href === undefined);

  const pressedState = createControllableState({
    value: () => pressed,
    defaultValue: () => defaultPressed,
    onChange: (next) => onPressedChange?.(next),
    assign: (next) => (pressed = next),
    componentName: 'Button',
    stateName: 'pressed',
  });
  const isPressed = $derived(isToggleButton && pressedState.current);
  const interactionBlocked = $derived(disabled || loading);

  const shapeTransition = $derived(
    getButtonShapeTransition({
      size,
      shape,
      shapeFeedback,
      isPressed,
      disabled: interactionBlocked,
      transition,
    }),
  );
  const resolvedStateColor = $derived(
    stateColor ?? getButtonStateColor({ variant, toggleable: isToggleButton, isPressed }),
  );
  const progressColor = $derived(
    getButtonProgressColor({ variant, disabled, toggleable: isToggleButton, isPressed }),
  );

  const styles = createStyle(buttonStyle, () => ({
    type,
    icon,
    iconPosition,
    shapeFeedback,
    stateColor,
    transition,
    size,
    edgeAligned,
    shape,
    disabled,
    loading,
    variant,
    className: mergeClassNames<ButtonInterface>('button', classes, hostClass),
    isPressed,
    toggleable: isToggleButton,
    pressed,
    defaultPressed,
    label,
  }));

  $effect(() => {
    if (hasVisibleLabel) return;
    console.error(
      'Udixio UI: <Button> requires one non-empty `label` or `children` content source. Rendering nothing.',
    );
  });

  const handleClick = (
    event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) },
  ) => {
    const interaction = getButtonPressTransition({
      disabled,
      loading,
      toggleable: isToggleButton,
      isPressed,
    });

    if (interaction.blocked) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (interaction.nextPressed !== undefined) {
      pressedState.set(interaction.nextPressed);
    }
    onclick?.(event);
  };
</script>

{#snippet content()}
  <span class={styles.current['touchTarget']}></span>
  <StateLayer
    {shapeTransition}
    class={styles.current['stateLayer']}
    colorName={resolvedStateColor}
    stateClassName="state-ripple-group-[button]"
  />
  {#if resolvedIconPosition === 'start' && icon}
    <Icon {icon} class={styles.current['icon']} />
  {/if}
  {#if loading}
    <span aria-hidden="true" class="!absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
      <!--
        `activeIndicator` always carries its own `stroke-primary` class, which wins
        over an inherited `stroke`; forcing the colour through a CSS variable with
        `!important` is what lets it apply, as in the React and Angular adapters.
      -->
      <ProgressIndicator
        classes={{
          progressIndicator: 'h-6 w-6',
          activeIndicator: '!stroke-[var(--button-progress-color)]',
        }}
        aria-hidden="true"
        style={`--button-progress-color: ${progressColor}`}
        variant="circular-indeterminate"
      />
    </span>
  {/if}
  <span class={styles.current['label']}>
    {#if children}{@render children()}{:else}{label}{/if}
  </span>
  {#if resolvedIconPosition === 'end' && icon}
    <Icon {icon} class={styles.current['icon']} />
  {/if}
{/snippet}

{#if !hasVisibleLabel}
  <!-- No content source: render nothing, as React does. -->
{:else if href !== undefined}
  <a
    {...rest}
    class={styles.current['button']}
    href={interactionBlocked ? undefined : href}
    {target}
    {rel}
    aria-disabled={interactionBlocked || undefined}
    aria-pressed={isToggleButton ? isPressed : undefined}
    aria-busy={loading || undefined}
    tabindex={interactionBlocked ? -1 : rest.tabindex}
    role={interactionBlocked ? 'link' : rest.role}
    onclick={handleClick}
  >
    {@render content()}
  </a>
{:else}
  <button
    {...rest}
    class={styles.current['button']}
    {type}
    disabled={interactionBlocked}
    aria-pressed={isToggleButton ? isPressed : undefined}
    aria-busy={loading || undefined}
    onclick={handleClick}
  >
    {@render content()}
  </button>
{/if}
