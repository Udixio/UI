<script module lang="ts">
  let nextSplitButtonId = 0;
</script>

<script lang="ts">
  import {
    getButtonStateColor,
    getSplitButtonMenuVariant,
    getSplitButtonOpenTransition,
    isSplitButtonValid,
    mergeClassNames,
    splitButtonStyle,
    type SplitButtonAction,
    type SplitButtonInterface,
  } from '@udixio/core';
  import {
    createSplitButtonController,
    type SplitButtonController,
  } from '@udixio/core/dom';
  import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
  import type { MenuInitialFocus } from '@udixio/core';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import Button from '../button/Button.svelte';
  import IconButton from '../icon-button/IconButton.svelte';
  import Menu from '../menu/Menu.svelte';
  import MenuItem from '../menu/MenuItem.svelte';
  import type { SvelteSplitButtonProps } from './split-button.types';

  let {
    label,
    icon,
    accessibleLabel,
    menuLabel,
    actions,
    variant = 'filled',
    size = 'small',
    primaryButtonProps = {},
    menuButtonProps = {},
    disabled = false,
    open = $bindable(),
    defaultOpen = false,
    onOpenChange,
    onPrimaryAction,
    onActionSelect,
    class: hostClass = '',
    classes,
    ...rest
  }: SvelteSplitButtonProps = $props();

  let root: HTMLDivElement | undefined = $state();
  let controller: SplitButtonController | undefined;
  let menuInitialFocus: MenuInitialFocus = $state('first');
  const menuId = `split-button-menu-${nextSplitButtonId++}`;

  const openState = createControllableState({
    value: () => open,
    defaultValue: () => defaultOpen,
    onChange: (next) => onOpenChange?.(next),
    assign: (next) => (open = next),
    componentName: 'SplitButton',
    stateName: 'open',
  });
  const isOpen = $derived(openState.current);
  const hasPrimaryLabel = $derived((label?.trim() ?? '') !== '');
  const isValid = $derived(
    isSplitButtonValid({ label, icon, accessibleLabel, menuLabel, actions }),
  );
  const stateColor = $derived(
    getButtonStateColor({ variant, toggleable: false, isPressed: false }),
  );
  const menuVariant = $derived(getSplitButtonMenuVariant(variant));
  const styles = createStyle(splitButtonStyle, () => ({
    label,
    icon,
    accessibleLabel,
    menuLabel,
    actions,
    variant,
    size,
    primaryButtonProps,
    menuButtonProps,
    disabled,
    open,
    defaultOpen,
    isOpen,
    className: mergeClassNames<SplitButtonInterface>(
      'splitButton',
      classes,
      hostClass,
    ),
  }));

  const requestOpen = (reason: 'trigger' | 'keyboard' | 'dismiss') => {
    const transition = getSplitButtonOpenTransition({
      isOpen,
      disabled,
      reason,
    });
    if (!transition.blocked) openState.set(transition.nextOpen);
  };

  const toggleMenu = () => {
    menuInitialFocus = 'first';
    requestOpen('trigger');
  };

  const handleMenuTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    menuInitialFocus = event.key === 'ArrowUp' ? 'last' : 'first';
    requestOpen('keyboard');
  };

  const runPrimaryAction = () => {
    onPrimaryAction?.();
    if (isOpen) requestOpen('dismiss');
  };

  const selectAction = (action: SplitButtonAction, index: number) => {
    if (disabled || action.disabled) return;
    onActionSelect?.(action, index);
    if (!action.href) controller?.restoreFocusOnClose();
    requestOpen('dismiss');
  };

  $effect(() => {
    if (!isValid || !root) return;
    const primaryButton = root.querySelector<HTMLButtonElement>(
      '.primary-button',
    );
    const menuButton = root.querySelector<HTMLButtonElement>('.menu-button');
    const menuIcon = menuButton?.querySelector<HTMLElement>('.icon');
    if (!primaryButton || !menuButton || !menuIcon) return;
    const created = createSplitButtonController({
      root,
      primaryButton,
      menuButton,
      menuIcon,
      size,
      onDismiss: () => requestOpen('dismiss'),
    });
    controller = created;
    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => {
    const nextOpen = isOpen;
    controller?.setOpen(nextOpen);
  });

  $effect(() => {
    if (disabled && isOpen) requestOpen('dismiss');
  });
</script>

{#if isValid}
  <div
    {...rest}
    bind:this={root}
    class={styles.current['splitButton']}
    role="group"
    aria-label={hasPrimaryLabel ? label : accessibleLabel || menuLabel}
    data-open={isOpen}
  >
    <Button
      {...primaryButtonProps}
      classes={{
        button: styles.current['primaryButton'],
        touchTarget: styles.current['primaryTouchTarget'],
        stateLayer: styles.current['primaryStateLayer'],
        icon: styles.current['primaryIcon'],
        label: styles.current['primaryLabel'],
      }}
      label={hasPrimaryLabel ? label : accessibleLabel}
      {icon}
      iconPosition="start"
      {variant}
      {size}
      shape="rounded"
      shapeFeedback="none"
      {disabled}
      aria-label={hasPrimaryLabel ? undefined : accessibleLabel || undefined}
      onclick={runPrimaryAction}
    />

    <IconButton
      {...menuButtonProps}
      classes={{
        iconButton: styles.current['menuButton'],
        touchTarget: styles.current['menuTouchTarget'],
        stateLayer: styles.current['menuStateLayer'],
        icon: styles.current['menuIcon'],
      }}
      label={menuLabel}
      icon={iKeyboardArrowDown}
      tooltip={menuButtonProps.tooltip ?? false}
      variant={menuVariant}
      {size}
      stateColor={menuButtonProps.stateColor ?? stateColor}
      shape="rounded"
      shapeFeedback="none"
      {disabled}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls={menuId}
      onclick={toggleMenu}
      onkeydown={handleMenuTriggerKeyDown}
    />

    {#if isOpen}
      <div
        id={menuId}
        class={styles.current['menuSurface']}
        role="presentation"
        data-split-button-menu
      >
        <Menu purpose="actions" accessibleLabel={menuLabel} initialFocus={menuInitialFocus}>
          {#each actions as action, index (action.id)}
            <MenuItem
              label={action.label}
              leadingIcon={action.icon}
              href={action.href}
              disabled={disabled || !!action.disabled}
              onclick={() => selectAction(action, index)}
            />
          {/each}
        </Menu>
      </div>
    {/if}
  </div>
{/if}
