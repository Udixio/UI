<script lang="ts">
  import {
    getSwitchChangeTransition,
    getSwitchHandleOffset,
    mergeClassNames,
    switchStyle,
    type SwitchInterface,
  } from '@udixio/core';
  import {
    createSwitchThumbController,
    type SwitchThumbController,
  } from '@udixio/core/dom';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteSwitchProps } from './switch.types';

  let {
    checked = $bindable(),
    defaultChecked = false,
    activeIcon,
    inactiveIcon,
    disabled = false,
    class: hostClass = '',
    classes,
    onCheckedChange,
    onclick,
    onkeydown,
    ...rest
  }: SvelteSwitchProps = $props();

  const checkedState = createControllableState({
    value: () => checked,
    defaultValue: () => defaultChecked,
    onChange: (next) => onCheckedChange?.(next),
    assign: (next) => (checked = next),
    componentName: 'Switch',
    stateName: 'checked',
  });
  const isChecked = $derived(checkedState.current);
  const resolvedIcon = $derived(isChecked ? activeIcon : inactiveIcon);
  const handleOffset = $derived(getSwitchHandleOffset(isChecked));

  const styles = createStyle(switchStyle, () => ({
    checked,
    defaultChecked,
    activeIcon,
    inactiveIcon,
    disabled,
    isChecked,
    className: mergeClassNames<SwitchInterface>('switch', classes, hostClass),
  }));

  let handleContainer: HTMLDivElement | undefined = $state();
  let controller: SwitchThumbController | undefined;
  let isFirstUpdate = true;

  $effect(() => {
    if (!handleContainer) return;
    const root = handleContainer;
    const created = createSwitchThumbController({ root });
    controller = created;
    isFirstUpdate = true;

    return () => {
      created.destroy();
      if (controller === created) controller = undefined;
    };
  });

  $effect(() => {
    const checkedValue = isChecked;
    if (!controller) return;
    // The initial translate is rendered directly; only later state changes
    // should ask the shared controller to animate.
    if (isFirstUpdate) {
      isFirstUpdate = false;
      return;
    }
    controller.update(
      getSwitchHandleOffset(!checkedValue),
      getSwitchHandleOffset(checkedValue),
    );
  });

  const handleToggle = () => {
    const transition = getSwitchChangeTransition({
      disabled,
      isChecked,
    });
    if (!transition.blocked) checkedState.set(transition.nextChecked);
  };

  const handleClick = (
    event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => {
    handleToggle();
    onclick?.(event);
  };

  const handleKeyDown = (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
    onkeydown?.(event);
  };
</script>

<div
  {...rest}
  role="switch"
  aria-checked={isChecked}
  aria-disabled={disabled || undefined}
  tabindex={disabled ? -1 : 0}
  class={styles.current['switch']}
  onclick={handleClick}
  onkeydown={handleKeyDown}
>
  <div
    bind:this={handleContainer}
    class={styles.current['handleContainer']}
    style:translate={`${handleOffset}px`}
  >
    <StateLayer
      class={styles.current['stateLayer']}
      colorName={isChecked ? 'primary' : 'on-surface'}
      stateClassName="state-ripple-group-[switch]"
    />
    <div class={styles.current['handle']}>
      {#if resolvedIcon}
        <Icon icon={resolvedIcon} class={styles.current['icon']} />
      {/if}
    </div>
  </div>
</div>
