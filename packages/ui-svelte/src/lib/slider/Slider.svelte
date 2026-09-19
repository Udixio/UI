<script lang="ts">
  import {
    getSliderKeyboardTransition,
    getSliderPercentFromValue,
    mergeClassNames,
    sliderStyle,
    SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS,
    type SliderInterface,
  } from '@udixio/core';
  import {
    createSliderIndicatorController,
    createSliderPointerController,
    type SliderIndicatorController,
    type SliderPointerController,
  } from '@udixio/core/dom';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteSliderProps } from './slider.types';

  let {
    value = $bindable(),
    defaultValue = 0,
    disabled = false,
    name,
    valueFormatter,
    step,
    min = 0,
    max = 100,
    marks,
    class: hostClass = '',
    classes,
    onChange,
    onkeydown,
    onblur,
    ...rest
  }: SvelteSliderProps = $props();

  const handleValueChange = (next: number) => onChange?.(next);

  const resolvedStep = $derived(step ?? (marks ? undefined : 10));
  const resolvedMarks = $derived(
    marks ?? [
      {
        value: min === -Infinity ? 0 : min,
        label: String(min === -Infinity ? 0 : min),
      },
      {
        value: max === Infinity ? 100 : max,
        label: String(max === Infinity ? 100 : max),
      },
    ],
  );

  const valueState = createControllableState({
    value: () => value,
    defaultValue: () => defaultValue,
    onChange: handleValueChange,
    assign: (next) => (value = next),
    componentName: 'Slider',
    stateName: 'value',
  });
  const resolvedValue = $derived(valueState.current);
  const percent = $derived(
    getSliderPercentFromValue(resolvedValue, {
      min,
      max,
      marks: resolvedMarks,
    }),
  );
  const formattedValue = $derived(
    valueFormatter ? valueFormatter(resolvedValue) : resolvedValue,
  );
  const ariaValueMin = $derived(min === -Infinity ? undefined : min);
  const ariaValueMax = $derived(max === Infinity ? undefined : max);

  let isDragging = $state(false);
  let isKeyboardActive = $state(false);
  const isChanging = $derived(isDragging || isKeyboardActive);

  let track: HTMLDivElement | undefined = $state();
  let indicator: HTMLDivElement | undefined = $state();
  let sliderWidth = $state(0);
  let indicatorController: SliderIndicatorController | undefined = $state.raw();
  let keyboardIndicatorTimeout: ReturnType<typeof setTimeout> | undefined = $state();

  // Keep the pointer controller attached once while its getters observe the
  // latest inputs. Recreating it for every prop update would lose an active
  // drag and duplicate window listeners.
  const livePointerOptions = $derived({
    min,
    max,
    step: resolvedStep,
    marks: resolvedMarks,
    disabled,
  });

  const styles = createStyle(sliderStyle, () => ({
    value,
    defaultValue,
    disabled,
    name,
    step,
    min,
    max,
    marks,
    valueFormatter,
    onChange: handleValueChange,
    isChanging,
    className: mergeClassNames<SliderInterface>('slider', classes, hostClass),
  }));

  $effect(() => {
    const root = track;
    if (!root) return;

    const controller: SliderPointerController = createSliderPointerController({
      track: root,
      min: () => livePointerOptions.min,
      max: () => livePointerOptions.max,
      step: () => livePointerOptions.step,
      marks: () => livePointerOptions.marks,
      disabled: () => livePointerOptions.disabled,
      onValueChange: (next) => valueState.set(next),
      onDraggingChange: (dragging) => (isDragging = dragging),
    });

    return () => controller.destroy();
  });

  $effect(() => {
    const valueIndicator = indicator;
    if (!valueIndicator) return;

    const controller = createSliderIndicatorController({ indicator: valueIndicator });
    indicatorController = controller;

    return () => {
      controller.destroy();
      if (indicatorController === controller) indicatorController = undefined;
    };
  });

  $effect(() => {
    const changing = isChanging;
    indicatorController?.setVisible(changing);
  });

  $effect(() => {
    const root = track;
    if (!root) return;

    const updateSliderWidth = () => (sliderWidth = root.offsetWidth);
    updateSliderWidth();
    window.addEventListener('resize', updateSliderWidth);

    return () => window.removeEventListener('resize', updateSliderWidth);
  });

  $effect(() => () => clearTimeout(keyboardIndicatorTimeout));

  const markPercent = (markValue: number) =>
    getSliderPercentFromValue(markValue, {
      min,
      max,
      marks: resolvedMarks,
    });

  const dotClass = (markValue: number) => {
    const dot = styles.current['dot'];
    const handleAndGapPercent =
      ((isChanging ? 9 : 10) / (sliderWidth || 1)) * 100;
    const valuePercent = markPercent(markValue);

    if (valuePercent <= percent - handleAndGapPercent) return `${dot} bg-primary-container`;
    if (valuePercent >= percent + handleAndGapPercent) return `${dot} bg-primary`;
    return dot;
  };

  const handleKeyDown = (
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => {
    const transition = getSliderKeyboardTransition({
      key: event.key,
      value: resolvedValue,
      min,
      max,
      step: resolvedStep,
      marks: resolvedMarks,
      disabled,
    });

    if (!transition.blocked) {
      event.preventDefault();
      valueState.set(transition.nextValue);
      isKeyboardActive = true;
      clearTimeout(keyboardIndicatorTimeout);
      keyboardIndicatorTimeout = setTimeout(
        () => (isKeyboardActive = false),
        SLIDER_KEYBOARD_INDICATOR_TIMEOUT_MS,
      );
    }

    onkeydown?.(event);
  };

  const handleBlur = (
    event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement },
  ) => {
    clearTimeout(keyboardIndicatorTimeout);
    isKeyboardActive = false;
    onblur?.(event);
  };
</script>

<div
  {...rest}
  bind:this={track}
  role="slider"
  tabindex={disabled ? -1 : 0}
  aria-valuemin={ariaValueMin}
  aria-valuemax={ariaValueMax}
  aria-valuenow={resolvedValue}
  aria-valuetext={String(formattedValue)}
  aria-disabled={disabled || undefined}
  class={styles.current['slider']}
  onkeydown={handleKeyDown}
  onblur={handleBlur}
>
  <input type="hidden" name={name} value={resolvedValue} disabled={disabled} />
  <div class={styles.current['activeTrack']} style:flex={percent / 100}></div>
  <div class={styles.current['handle']}>
    <div class="absolute bottom-[calc(100%+4px)] left-1/2 -translate-x-1/2 transform">
      <div
        bind:this={indicator}
        class={styles.current['valueIndicator']}
        style:transform="scale(0)"
      >
        {formattedValue}
      </div>
    </div>
  </div>
  <div class={styles.current['inactiveTrack']} style:flex={1 - percent / 100}></div>
  <div class="w-[calc(100%-12px)] h-full absolute -translate-x-1/2 transform left-1/2">
    {#each resolvedMarks as mark (mark.value)}
      <div class={dotClass(mark.value)} style:left={`${markPercent(mark.value)}%`}></div>
    {/each}
  </div>
</div>
