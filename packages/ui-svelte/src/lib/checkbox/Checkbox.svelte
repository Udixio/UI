<script module lang="ts">
  let nextCheckboxId = 0;
</script>

<script lang="ts">
  import {
    checkboxStyle,
    getCheckboxChangeTransition,
    mergeClassNames,
    type CheckboxInterface,
  } from '@udixio/core';
  import { iCheck } from '@udixio/icons-rounded-400/check';
  import { iRemove } from '@udixio/icons-rounded-400/remove';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteCheckboxProps } from './checkbox.types';

  let {
    checked = $bindable(),
    defaultChecked = false,
    indeterminate = false,
    disabled = false,
    invalid = false,
    name,
    id,
    value,
    required = false,
    class: hostClass = '',
    classes,
    style: hostStyle,
    onCheckedChange,
    onfocus,
    onblur,
    ...rest
  }: SvelteCheckboxProps = $props();

  const fallbackId = `checkbox-${nextCheckboxId++}`;
  const resolvedId = $derived(id ?? fallbackId);
  let isFocused = $state(false);
  let inputElement: HTMLInputElement | undefined = $state();

  const checkedState = createControllableState({
    value: () => checked,
    defaultValue: () => defaultChecked,
    onChange: (next) => onCheckedChange?.(next),
    assign: (next) => (checked = next),
    componentName: 'Checkbox',
    stateName: 'checked',
  });
  const isChecked = $derived(checkedState.current);
  const stateColor = $derived(isChecked || indeterminate ? 'primary' : 'on-surface');

  const styles = createStyle(checkboxStyle, () => ({
    checked,
    defaultChecked,
    indeterminate,
    disabled,
    invalid,
    id: resolvedId,
    name,
    value,
    required,
    isChecked,
    isFocused,
    className: mergeClassNames<CheckboxInterface>('checkbox', classes, hostClass),
  }));

  // `indeterminate` is a DOM property, not an HTML attribute. Keeping the
  // native control in sync here also covers a controlled owner that rejects a
  // checked transition through a function binding.
  $effect(() => {
    if (!inputElement) return;
    inputElement.indeterminate = indeterminate;
    inputElement.checked = isChecked;
  });

  const handleChange = () => {
    if (!inputElement) return;
    const transition = getCheckboxChangeTransition({
      disabled,
      isChecked,
    });

    if (transition.blocked) {
      inputElement.checked = isChecked;
      inputElement.indeterminate = indeterminate;
      return;
    }

    checkedState.set(transition.nextChecked);
    // Svelte updates a bound prop in the next flush. The current value is
    // already the owner's answer for a function binding, so restore it now if
    // the owner rejected the transition.
    inputElement.checked = checkedState.current;
  };

  const handleFocus = (event: FocusEvent) => {
    isFocused = true;
    onfocus?.(event);
  };

  const handleBlur = (event: FocusEvent) => {
    isFocused = false;
    onblur?.(event);
  };
</script>

<div class={styles.current['checkbox']} style={hostStyle}>
  <StateLayer
    class={styles.current['stateLayer']}
    colorName={stateColor}
    stateClassName="state-ripple-group-[checkbox]"
  />
  <input
    {...rest}
    bind:this={inputElement}
    class={styles.current['input']}
    type="checkbox"
    id={resolvedId}
    name={name}
    value={value}
    checked={isChecked}
    disabled={disabled}
    required={required}
    aria-invalid={invalid || undefined}
    onfocus={handleFocus}
    onblur={handleBlur}
    onchange={handleChange}
  />
  <span aria-hidden="true" class={styles.current['box']}></span>
  {#if isChecked || indeterminate}
    <Icon icon={indeterminate ? iRemove : iCheck} class={styles.current['icon']} />
  {/if}
</div>
